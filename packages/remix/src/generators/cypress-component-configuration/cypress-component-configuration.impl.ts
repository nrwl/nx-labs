import {
  ensurePackage,
  formatFiles,
  generateFiles,
  readProjectConfiguration,
  type Tree,
} from '@nx/devkit';
import { join } from 'path';
import { getPackageVersion } from '../../utils/versions';
import { type CypressComponentConfigurationSchema } from './schema';

export default async function cypressComponentConfigurationGenerator(
  tree: Tree,
  options: CypressComponentConfigurationSchema
) {
  const { cypressComponentConfigGenerator } = ensurePackage<
    typeof import('@nx/react')
  >('@nx/react', getPackageVersion(tree, 'nx'));

  await cypressComponentConfigGenerator(tree, {
    project: options.project,
    generateTests: options.generateTests,
    skipFormat: true,
    bundler: 'vite',
    buildTarget: '',
  });

  const project = readProjectConfiguration(tree, options.project);

  generateFiles(tree, join(__dirname, './files'), project.root, { tmpl: '' });

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
}
