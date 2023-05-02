import { formatFiles, installPackagesTask, Tree } from '@nx/devkit';
import { initDeno } from '../init/generator';
import { addPathToDenoSettings } from '../utils/add-path';
import { addFiles, addProjectConfig, normalizeOptions } from './lib';
import { DenoAppGeneratorSchema } from './schema';

export async function denoApplicationGenerator(
  tree: Tree,
  options: DenoAppGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);

  await initDeno(tree);
  addProjectConfig(tree, normalizedOptions);
  addFiles(tree, normalizedOptions);
  addPathToDenoSettings(tree, normalizedOptions.projectRoot);

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
  };
}

export default denoApplicationGenerator;
