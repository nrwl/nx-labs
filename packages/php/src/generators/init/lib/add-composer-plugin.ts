import { createProjectGraphAsync, type Tree } from '@nx/devkit';
import { addPlugin } from '@nx/devkit/src/utils/add-plugin';
import { createNodesV2 } from '../../../composer/plugin/create-nodes';

export async function addComposerPlugin(
  tree: Tree,
  _options: { skipPackageJson?: boolean }
): Promise<void> {
  await addPlugin(
    tree,
    await createProjectGraphAsync(),
    '@nx/php/composer',
    createNodesV2,
    {
      installTargetName: ['install', 'composer:install', 'composer-install'],
      updateTargetName: ['update', 'composer:update', 'composer-update'],
      ignorePattern: ['**/{tests,fixtures}/**'],
    },
    false
  );
}
