import { Tree, updateJson } from '@nx/devkit';
import { serverlessGenerator } from '../serverless/serverless';
import { PresetGeneratorSchema } from './schema';

export default async function (tree: Tree, options: PresetGeneratorSchema) {
  const appTask = serverlessGenerator(tree, options);

  updateJson(tree, 'package.json', (json) => {
    json.scripts ??= {};
    json.scripts.lint ??= 'npx nx lint';
    json.scripts.test ??= 'npx nx test';
    json.scripts['serve-functions'] ??= 'npx nx serve-functions';
    json.scripts['deploy-functions'] ??= 'npx nx deploy-functions';

    return json;
  });

  tree.delete('apps');
  tree.delete('libs');

  return appTask;
}
