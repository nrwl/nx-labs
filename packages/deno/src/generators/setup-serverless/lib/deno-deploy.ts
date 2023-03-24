import {
  joinPathFragments,
  output,
  ProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { assertNoTarget } from './utils';

export function addDenoDeployConfig(
  tree: Tree,
  projectConfig: ProjectConfiguration
) {
  assertNoTarget(projectConfig, 'deploy');

  addDeployTarget(tree, projectConfig);
}

function addDeployTarget(tree: Tree, projectConfig: ProjectConfiguration) {
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

  const projectArg = '--project=<Your-Deno-Deploy-Project-Name>';
  output.note({
    title: 'Next Step: Set Project Name',
    bodyLines: [
      `Make sure you set the correct name of your Deno Deploy project in the ${projectConfig.name} configuration.`,
      `This value is from the Deno Deploy dashboard: https://dash.deno.com/`,
    ],
  });

  projectConfig.targets.deploy = {
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
}
