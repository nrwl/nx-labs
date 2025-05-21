import { createProjectGraphAsync, globAsync, type Tree } from '@nx/devkit';
import { addPlugin } from '@nx/devkit/src/utils/add-plugin';
import {
  createNodesV2,
  phpunitConfigGlob,
} from '../../../phpunit/plugin/create-nodes';

export async function addPhpunitPlugin(
  tree: Tree,
  _options: { skipPackageJson?: boolean }
): Promise<void> {
  const phpunitConfigs = await globAsync(tree, [phpunitConfigGlob]);
  if (!phpunitConfigs.length) return;

  await addPlugin(
    tree,
    await createProjectGraphAsync(),
    '@nx/php/phpunit',
    createNodesV2,
    {
      targetName: ['test', 'phpunit:test', 'phpunit-test'],
    },
    false
  );
}
