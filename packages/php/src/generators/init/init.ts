import {
  addDependenciesToPackageJson,
  formatFiles,
  GeneratorCallback,
  readNxJson,
  Tree,
} from '@nx/devkit';
import { version } from '../../../package.json';
import { addComposerPlugin } from './lib/add-composer-plugin';
import { addPhpunitPlugin } from './lib/add-phpunit-plugin';
import { InitGeneratorSchema } from './schema';

export async function initGenerator(tree: Tree, options: InitGeneratorSchema) {
  let task: GeneratorCallback | undefined = undefined;

  const nxJson = readNxJson(tree);
  const usePlugins =
    process.env.NX_ADD_PLUGINS !== 'false' &&
    nxJson.useInferencePlugins !== false;

  if (!usePlugins) {
    throw new Error(
      `Cannot initialize @nx/php plugin unless NX_ADD_PLUGINS is set to true or useInferencePlugins is not set to false in nx.json.`
    );
  }

  if (!options.skipPackageJson && tree.exists('package.json')) {
    task = addDependenciesToPackageJson(
      tree,
      {},
      {
        '@nx/php': version,
      },
      undefined
    );
  }
  await addComposerPlugin(tree, options);
  await addPhpunitPlugin(tree, options);

  if (!options.skipFormat) await formatFiles(tree);

  return task;
}

export default initGenerator;
