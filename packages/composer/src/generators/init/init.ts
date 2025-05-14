import {
  addDependenciesToPackageJson,
  createProjectGraphAsync,
  formatFiles,
  GeneratorCallback,
  readNxJson,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import { addPlugin } from '@nx/devkit/src/utils/add-plugin';
import { version } from '../../../package.json';
import { createNodesV2 } from '../../plugin/create-nodes';
import { InitGeneratorSchema } from './schema';

export async function initGenerator(tree: Tree, options: InitGeneratorSchema) {
  const tasks: GeneratorCallback[] = [];

  const nxJson = readNxJson(tree);
  const usePlugins =
    process.env.NX_ADD_PLUGINS !== 'false' &&
    nxJson.useInferencePlugins !== false;

  if (!usePlugins) {
    throw new Error(
      `Cannot add @nx/composer plugin unless NX_ADD_PLUGINS is set to true or useInferencePlugins is not set to false in nx.json.`
    );
  }

  if (!options.skipPackageJson) {
    tasks.push(
      addDependenciesToPackageJson(
        tree,
        {},
        {
          '@nx/composer': version,
        },
        undefined
      )
    );
  }

  await addPlugin(
    tree,
    await createProjectGraphAsync(),
    '@nx/composer',
    createNodesV2,
    {},
    false
  );

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

export default initGenerator;
