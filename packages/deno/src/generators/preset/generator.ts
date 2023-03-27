import { Tree, updateJson } from '@nrwl/devkit';
import applicationGenerator from '../application/application';
import { PresetGeneratorSchema } from './schema';

export default async function (tree: Tree, options: PresetGeneratorSchema) {
  const appTask = await applicationGenerator(tree, {
    name: options.name,
    linter: 'deno',
    unitTestRunner: 'deno',
    withWatch: true,
    rootProject: true,
  });

  updateJson(tree, 'deno.json', (json) => {
    json['tasks'] = {
      start: 'npx nx serve',
      lint: 'npx nx lint',
      test: 'npx nx test',
      build: 'npx nx build',
    };

    return json;
  });

  // Remove these folders so projects will be generated at the root.
  tree.delete('apps');
  tree.delete('libs');

  return appTask;
}
