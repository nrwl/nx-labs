import { formatFiles, GeneratorCallback, output, Tree } from '@nx/devkit';
import { addAgnosticConfig } from './lib/agnostic';
import { addNetlifyConfig } from './lib/netlify';
import { DenoSetupServerlessSchema } from './schema';

export async function denoSetupFunctions(
  tree: Tree,
  options: DenoSetupServerlessSchema
) {
  const opts = normalizeOptions(options);
  let task: GeneratorCallback = () => undefined;

  switch (options.platform) {
    case 'netlify':
      task = addNetlifyConfig(tree, opts);
      break;
    case 'none':
    default:
      addAgnosticConfig(tree, opts);
      break;
  }

  await formatFiles(tree);
  return task;
}

function normalizeOptions(options: DenoSetupServerlessSchema) {
  if (!options.site && options.platform !== 'none') {
    output.note({
      title: 'Next Step: Set Site Name',
      bodyLines: [
        `A value for --site was not passed`,
        `Make sure to set the site name in the ${options.project} deploy configuration.`,
        options.platform === 'netlify'
          ? `This value is from the Netlify dashboard: https://app.netlify.com/`
          : '',
      ],
    });
  }

  options.deployTarget ??= 'deploy-functions';
  options.serveTarget ??= 'serve-functions';

  return options;
}
export default denoSetupFunctions;
