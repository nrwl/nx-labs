import {
  formatFiles,
  readWorkspaceConfiguration,
  Tree,
  updateWorkspaceConfiguration,
} from '@nrwl/devkit';

import { NxRemixGeneratorSchema } from './schema';
import { normalizeOptions } from './lib/normalize-options';
import applicationGenerator from '../application/application.impl';

export default async function (tree: Tree, _options: NxRemixGeneratorSchema) {
  const options = normalizeOptions(tree, _options);

  const workspaceConfig = readWorkspaceConfiguration(tree);
  workspaceConfig.workspaceLayout = {
    appsDir: 'packages',
    libsDir: 'packages',
  };
  updateWorkspaceConfiguration(tree, workspaceConfig);

  const task = await applicationGenerator(tree, {
    name: options.projectName,
    tags: options.tags,
    skipFormat: true,
  });

  tree.delete('apps');
  tree.delete('libs');

  await formatFiles(tree);

  return task;
}
