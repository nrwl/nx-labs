import { formatFiles, Tree, updateJson } from '@nrwl/devkit';

import { NxRemixGeneratorSchema } from './schema';
import { normalizeOptions } from './lib/normalize-options';
import applicationGenerator from '../application/application.impl';

export default async function (tree: Tree, _options: NxRemixGeneratorSchema) {
  const options = normalizeOptions(tree, _options);

  const task = await applicationGenerator(tree, {
    name: options.projectName,
    tags: options.tags,
    skipFormat: true,
  });

  // Enable yarn/npm/pnpm workspaces for buildable libs
  updateJson(tree, 'package.json', (json) => {
    json.workspaces ??= ['dist/libs/*'];
    return json;
  });

  // No need for workspace.json in latest Nx
  tree.delete('workspace.json');

  await formatFiles(tree);

  return task;
}
