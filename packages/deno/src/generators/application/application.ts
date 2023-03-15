import { formatFiles, installPackagesTask, Tree } from '@nrwl/devkit';
import { initDeno } from '../init/generator';
import { denoSetupServerless } from '../setup-serverless/setup-serverless';
import { addPathToDenoSettings } from '../utils/add-path';
import {
  addFiles,
  addProjectConfig,
  applyNetlifyAppConfig,
  normalizeOptions,
} from './lib';
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

  if (options.platform && options.platform !== 'none') {
    await denoSetupServerless(tree, {
      platform: options.platform,
      project: normalizedOptions.projectName,
    });

    if (options.platform === 'netlify') {
      applyNetlifyAppConfig(tree, normalizedOptions);
    }
  }

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
  };
}

export default denoApplicationGenerator;
