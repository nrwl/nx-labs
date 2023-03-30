import { Tree, updateJson } from '@nrwl/devkit';
import { serverlessGenerator } from '../serverless/serverless';
import { PresetGeneratorSchema } from './schema';

export default async function (tree: Tree, options: PresetGeneratorSchema) {
  const appTask = serverlessGenerator(tree, options);

  updateJson(tree, 'package.json', (json) => {
    json.scripts ??= {};
    json.scripts.build ??= 'npx nx build';
    json.scripts.lint ??= 'npx nx lint';
    json.scripts.test ??= 'npx nx test';
    json.scripts.dev ??= 'npx nx dev';
    json.scripts.deploy ??= 'npx nx deploy';

    return json;
  });

  tree.delete('apps');
  tree.delete('libs');

  return appTask;
}
