import {
  GeneratorCallback,
  joinPathFragments,
  output,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { execSync } from 'child_process';
import { prompt } from 'enquirer';
import { assertNoTarget } from '../utils/assertion';
import { DenoSetupDeploySchema } from './schema';

export async function setupDeployGenerator(
  tree: Tree,
  opts: DenoSetupDeploySchema
): Promise<GeneratorCallback> {
  opts.deployTarget ??= 'deploy';
  if (!opts.site) {
    output.note({
      title: 'Next Step: Set Site Name',
      bodyLines: [
        `A value for --site was not passed`,
        `Make sure to set the site name in the ${opts.project} deploy configuration.`,
        `This value is from the Deno Deploy dashboard: https://dash.deno.com/`,
      ],
    });
  }

  const projectConfig = readProjectConfiguration(tree, opts.project);

  assertNoTarget(projectConfig, opts.deployTarget);

  const main =
    projectConfig.targets?.build?.options?.main ||
    joinPathFragments(projectConfig.sourceRoot, 'main.ts');

  let entrypointArg = main;
  if (!tree.exists(main)) {
    entrypointArg = '<Your-Entrypoint-file>';
    output.note({
      title: 'Next Step: Set Entrypoint',
      bodyLines: [
        `Tried to set the entrypoint to ${main} but it does not exist.`,
        `Make sure you set the correct entrypoint file for your projects deploy configuration.`,
      ],
    });
  }
  let projectArg = '--project=<Your-Deno-Deploy-Project-Name>';
  if (opts.site) {
    projectArg = `--project=${opts.site}`;
  }

  projectConfig.targets[opts.deployTarget] = {
    executor: 'nx:run-commands',
    options: {
      command: `deployctl deploy ${projectArg} --import-map=import_map.json --exclude=node_modules  ${entrypointArg} --dry-run`,
    },
    configurations: {
      preview: {
        command: `deployctl deploy ${projectArg} --import-map=import_map.json --exclude=node_modules ${entrypointArg}`,
      },
      production: {
        command: `deployctl deploy ${projectArg} --import-map=import_map.json --exclude=node_modules --prod ${entrypointArg}`,
      },
    },
  };

  updateProjectConfiguration(tree, projectConfig.name, projectConfig);
  const installDeployCtl = await checkForDeployCtl();

  let cb: GeneratorCallback = () => undefined;

  switch (installDeployCtl) {
    case 'install':
      cb = () => {
        execSync(
          'deno install -A --no-check -r -f https://deno.land/x/deploy/deployctl.ts',
          {
            encoding: 'utf-8',
            env: process.env,
          }
        );
      };
      break;

    case 'skipped':
      output.note({
        title: 'Next Step: Install deployctl',
        bodyLines: [
          `You'll need to install the Deno Deploy (deployctl) to use the deploy target, ${projectConfig.name}:deploy.`,
          `You can install it with the following command:`,
          `'deno install -A --no-check -r -f https://deno.land/x/deploy/deployctl.ts'`,
          `You can learn more about the Deno Deploy CLI here: https://deno.com/deploy/docs/deployctl.`,
          `Installing the Deno Deploy CLI is not required if you're using the GitHub Action integration.`,
        ],
      });
      break;

    case 'installed':
    default:
      break;
  }

  return cb;
}

async function checkForDeployCtl(): Promise<
  'installed' | 'skipped' | 'install'
> {
  try {
    execSync('deployctl --version', {
      encoding: 'utf-8',
      env: process.env,
      stdio: 'ignore',
    });
    return 'installed';
  } catch {
    if (process.env.NX_INTERACTIVE && process.env.NX_INTERACTIVE === 'true') {
      return (
        await prompt<{ install: boolean }>({
          type: 'confirm',
          name: 'install',
          message: 'Would you like to install the Deno Deploy CLI?',
        })
      ).install
        ? 'install'
        : 'skipped';
    }

    return 'skipped';
  }
}

export default setupDeployGenerator;
