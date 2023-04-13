import {
  detectPackageManager,
  GeneratorCallback,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  readProjectConfiguration,
  runTasksInSerial,
  Tree,
  updateJson,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { Linter } from '@nrwl/linter';
import { libraryGenerator } from '@nrwl/react/src/generators/library/library';
import { execSync } from 'child_process';
import { NxRemixGeneratorSchema } from './schema';

export default async function (tree: Tree, options: NxRemixGeneratorSchema) {
  const tasks: GeneratorCallback[] = [];
  const name = names(options.name).fileName;
  const pm = detectPackageManager();
  const { libsDir } = getWorkspaceLayout(tree);
  const projectRoot = joinPathFragments(libsDir, name);

  const libGenTask = await libraryGenerator(tree, {
    name,
    style: options.style,
    unitTestRunner: 'jest',
    tags: options.tags,
    importPath: options.importPath,
    skipFormat: false,
    skipTsConfig: false,
    linter: Linter.EsLint,
    component: true,
  });
  tasks.push(libGenTask);

  // Nest dist under project root to we can link it
  const project = readProjectConfiguration(tree, name);
  project.targets.build.options = {
    ...project.targets.build.options,
    format: ['cjs'],
    outputPath: joinPathFragments(projectRoot, 'dist'),
  };
  updateProjectConfiguration(tree, name, project);

  // Point to nested dist for yarn/npm/pnpm workspaces
  updateJson(tree, joinPathFragments(projectRoot, 'package.json'), (json) => {
    json.main = './dist/index.cjs.js';
    json.typings = './dist/index.d.ts';
    return json;
  });

  // Link workspaces
  tasks.push(() => {
    let command: string;
    if (pm === 'npm') {
      command = `npm install -ws`;
    } else if (pm === 'yarn') {
      command = `yarn`;
    } else if (pm === 'pnpm') {
      command = `pnpm install`;
    }
    execSync(command, {
      stdio: [0, 1, 2],
    });
  });

  return runTasksInSerial(...tasks);
}
