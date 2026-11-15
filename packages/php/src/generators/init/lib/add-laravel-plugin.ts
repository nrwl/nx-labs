import { createProjectGraphAsync, type Tree } from '@nx/devkit';
import { addPlugin } from '@nx/devkit/src/utils/add-plugin';
import { createNodesV2 } from '../../../laravel';

export async function addLaravelPlugin(
  tree: Tree,
  _options: { skipPackageJson?: boolean }
): Promise<void> {
  await addPlugin(
    tree,
    await createProjectGraphAsync(),
    '@nx/php/laravel',
    createNodesV2,
    {
      serveTargetName: ['serve'],
      migrateTargetName: ['migrate'],
      migrateFreshTargetName: ['migrate-fresh'],
      tinkerTargetName: ['tinker'],
      queueWorkTargetName: ['queue-work'],
      cacheClearTargetName: ['cache-clear'],
      routeListTargetName: ['route-list'],
    },
    false
  );
}