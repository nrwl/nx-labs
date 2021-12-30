import { formatFiles, GeneratorCallback, Tree } from '@nrwl/devkit';

import { RemixGeneratorSchema } from './schema';
import { normalizeOptions } from './lib/normalize-options';
import applicationGenerator from '../application/application.impl';
import setupGenerator from '../setup/setup.impl';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { setDefaultCollection } from '@nrwl/workspace/src/utilities/set-default-collection';

export default async function (tree: Tree, _options: RemixGeneratorSchema) {
  const options = normalizeOptions(tree, _options);
  const tasks: GeneratorCallback[] = [];

  const appGenTask = await applicationGenerator(tree, {
    name: options.projectName,
    tags: options.tags,
    skipFormat: true,
  });
  tasks.push(appGenTask);

  const setupGenTask = await setupGenerator(tree, {});
  tasks.push(setupGenTask);

  // No need for workspace.json in latest Nx
  tree.delete('workspace.json');

  setDefaultCollection(tree, '@nrwl/remix');

  await formatFiles(tree);

  return runTasksInSerial(...tasks);
}
