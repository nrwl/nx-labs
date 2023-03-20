import {
  formatFiles,
  installPackagesTask,
  readProjectConfiguration,
  Tree,
} from '@nrwl/devkit';
import { addAgnosticConfig } from './lib/agnostic';
import { addDenoDeployConfig } from './lib/deno-deploy';
import { addNetlifyConfig } from './lib/netlify';
import { DenoSetupServerlessSchema } from './schema';

export async function denoSetupServerless(
  tree: Tree,
  options: DenoSetupServerlessSchema
) {
  const projectConfig = readProjectConfiguration(tree, options.project);
  switch (options.platform) {
    case 'netlify':
      addNetlifyConfig(tree, projectConfig);
      break;
    case 'deno-deploy':
      addDenoDeployConfig(tree, projectConfig);
      break;
    case 'none':
    default:
      addAgnosticConfig(tree, projectConfig);
      break;
  }

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
  };
}
export default denoSetupServerless;
