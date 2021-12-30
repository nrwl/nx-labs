import {
  detectPackageManager,
  GeneratorCallback,
  joinPathFragments,
  names,
  readJson,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
  updateJson,
} from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/react/src/generators/library/library';
import { NxRemixGeneratorSchema } from './schema';
import { Linter } from '@nrwl/linter';
import { execSync } from 'child_process';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';

export default async function (tree: Tree, options: NxRemixGeneratorSchema) {
  const tasks: GeneratorCallback[] = [];
  const name = names(options.name).fileName;
  const pm = detectPackageManager();
  const projectRoot = joinPathFragments('libs', name);

  const libGenTask = await libraryGenerator(tree, {
    name,

    // Remix can only work with buildable libs and yarn/npm workspaces
    buildable: true,
    compiler: 'babel',

    style: 'css',
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
