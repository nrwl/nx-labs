import {
  addDependenciesToPackageJson,
  formatFiles,
  GeneratorCallback,
  readNxJson,
  Tree,
  updateNxJson,
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

  updateNxJsonConfiguration(tree);

  if (!options.skipFormat) await formatFiles(tree);

  return task;
}

function updateNxJsonConfiguration(tree: Tree) {
  const nxJson = readNxJson(tree);

  if (!nxJson.namedInputs) {
    nxJson.namedInputs = {};
  }
  const defaultFilesSet = nxJson.namedInputs.default ?? [];
  nxJson.namedInputs.default = Array.from(
    new Set([...defaultFilesSet, '{projectRoot}/**/*'])
  );
  const productionFileSet = nxJson.namedInputs.production ?? [];
  nxJson.namedInputs.production = Array.from(
    new Set([
      ...productionFileSet,
      'default',
      '!{projectRoot}/**/*.md',
      '!{projectRoot}/(test|tests|Test|Tests)/**/*',
    ])
  );
  updateNxJson(tree, nxJson);
}

export default initGenerator;
