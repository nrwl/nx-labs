import { initGenerator as composerInitGenerator } from '@nx/composer/generators';
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
      `Cannot add @nx/phpunit plugin unless NX_ADD_PLUGINS is set to true or useInferencePlugins is not set to false in nx.json.`
    );
  }

  await composerInitGenerator(tree, {
    skipFormat: true,
    skipPackageJson: options.skipPackageJson,
  });

  if (!options.skipPackageJson && tree.exists('package.json')) {
    tasks.push(
      addDependenciesToPackageJson(
        tree,
        {},
        {
          '@nx/phpunit': version,
        },
        undefined
      )
    );
  }

  await addPlugin(
    tree,
    await createProjectGraphAsync(),
    '@nx/phpunit',
    createNodesV2,
    {
      targetName: ['test', 'phpunit:test', 'phpunit-test'],
    },
    false
  );

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

export default initGenerator;
