import {
  detectPackageManager,
  formatFiles,
  GeneratorCallback,
  Tree,
  updateJson,
} from '@nrwl/devkit';

import { NxRemixGeneratorSchema } from './schema';
import { normalizeOptions } from './lib/normalize-options';
import applicationGenerator from '../application/application.impl';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';

export default async function (tree: Tree, _options: NxRemixGeneratorSchema) {
  const options = normalizeOptions(tree, _options);
  const tasks: GeneratorCallback[] = [];
  const pm = detectPackageManager();

  const appGenTask = await applicationGenerator(tree, {
    name: options.projectName,
    tags: options.tags,
    skipFormat: true,
  });
  tasks.push(appGenTask);

  // Enable yarn/npm/pnpm workspaces for buildable libs
  if (pm !== 'pnpm') {
    updateJson(tree, 'package.json', (json) => {
      json.workspaces ??= ['libs/*'];
      return json;
    });
  } else {
    tree.write(
      'pnpm-workspace.yaml',
      `packages:
  - 'libs/*`
    );
  }

  // Ignore nested project files
  const ignoreFile = tree.read('.gitignore').toString();
  tree.write(
    '.gitignore',
    `${ignoreFile
      .replace('/dist', 'dist')
      .replace('/node_modules', 'node_modules')}
  # Remix files
  apps/**/build
  apps/**/.cache
  `
  );

  updateJson(tree, 'nx.json', (json) => {
    json.targetDependencies.dev = [
      { target: 'build', projects: 'dependencies' },
    ];
    return json;
  });

  // No need for workspace.json in latest Nx
  tree.delete('workspace.json');

  await formatFiles(tree);

  return runTasksInSerial(...tasks);
}
