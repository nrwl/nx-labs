import {
  ensurePackage,
  generateFiles,
  joinPathFragments,
  readProjectConfiguration,
  type Tree,
} from '@nx/devkit';
import { join } from 'path';
import { getPackageVersion } from '../../utils/versions';
import type { StorybookConfigurationSchema } from './schema';

export default async function remixStorybookConfiguration(
  tree: Tree,
  schema: StorybookConfigurationSchema
) {
  const { root } = readProjectConfiguration(tree, schema.name);

  if (!tree.exists(joinPathFragments(root, 'vite.config.ts'))) {
    generateFiles(tree, join(__dirname, 'files'), root, { tpl: '' });
  }

  const { storybookConfigurationGenerator } = ensurePackage<
    typeof import('@nx/react')
  >('@nx/react', getPackageVersion(tree, 'nx'));

  const task = await storybookConfigurationGenerator(tree, schema);

  return task;
}
