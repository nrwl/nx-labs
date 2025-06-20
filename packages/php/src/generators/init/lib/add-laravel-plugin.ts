import {
  addDependenciesToPackageJson,
  readNxJson,
  Tree,
  updateNxJson,
} from '@nx/devkit';
import { createNodesV2 } from '../../../laravel';

export function addLaravelPlugin(
  tree: Tree,
  options: { skipPluginSetup?: boolean }
) {
  if (options.skipPluginSetup) {
    return;
  }

  const nxJson = readNxJson(tree);

  nxJson.plugins ??= [];

  if (
    !nxJson.plugins.some((p) =>
      typeof p === 'string'
        ? p === '@nx/php/laravel'
        : p.plugin === '@nx/php/laravel'
    )
  ) {
    nxJson.plugins.push({
      plugin: '@nx/php/laravel',
      options: {},
    });

    updateNxJson(tree, nxJson);
  }
}