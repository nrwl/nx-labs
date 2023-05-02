import { generateFiles, joinPathFragments, Tree, updateJson } from '@nx/devkit';
import { serverlessGenerator } from '../serverless/serverless';
import { PresetGeneratorSchema } from './schema';

export default async function (tree: Tree, options: PresetGeneratorSchema) {
  const appTask = serverlessGenerator(tree, options);

  updateJson(tree, 'package.json', (json) => {
    json.scripts ??= {};
    json.scripts.build ??= 'npx nx build';
    json.scripts.lint ??= 'npx nx lint';
    json.scripts.test ??= 'npx nx test';
    json.scripts.serve ??= 'npx nx serve';
    json.scripts.deploy ??= 'npx nx deploy';
    return json;
  });

  generateFiles(tree, joinPathFragments(__dirname, 'files'), '', {
    ...options,
    tmpl: '',
  });

  tree.delete('apps');
  tree.delete('libs');

  return appTask;
}
