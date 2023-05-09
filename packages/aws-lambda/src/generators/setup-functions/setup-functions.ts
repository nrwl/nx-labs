import {
  addDependenciesToPackageJson,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  readNxJson,
  readProjectConfiguration,
  runTasksInSerial,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';

import { awsLamdaTypesVersion, esbuildVersion } from '../../../utils/version';

import { createOrUpdateConfigFiles } from './lib/create-or-update-config-files';
import { NormalizedSchema, SetupFunctionsSchema } from './schema';

function normalizeOptions(
  tree: Tree,
  schema: SetupFunctionsSchema
): NormalizedSchema {
  const projectName = schema.name ?? readNxJson(tree).defaultProject;
  return {
    ...schema,
    projectName,
    serveTarget: schema.serveTarget ?? 'serve-functions',
    deployTarget: schema.deployTarget ?? 'deploy-functions',
  };
}

function createFiles(tree: Tree, options: NormalizedSchema) {
  const { projectName } = options;
  const projectConfig = readProjectConfiguration(tree, projectName);

  generateFiles(
    tree,
    joinPathFragments(__dirname, './files'),
    projectConfig.root,
    {
      tmpl: '',
      projectName,
    }
  );
}

function updateProjectConfig(tree: Tree, options: NormalizedSchema) {
  const projectConfig = readProjectConfiguration(tree, options.projectName);
  const isRootProject = projectConfig.root === '.';

  if (projectConfig) {
    projectConfig.targets[`${options.serveTarget}`] = {
      command: 'sam build && sam local start-api',
      options: isRootProject
        ? undefined
        : {
            cwd: projectConfig.root,
          },
    };

    projectConfig.targets[`${options.deployTarget}`] = {
      command: 'sam build && sam deploy --guided',
      options: isRootProject
        ? undefined
        : {
            cwd: projectConfig.root,
          },
    };

    updateProjectConfiguration(tree, options.projectName, projectConfig);
  }
}

export async function setupFunctionsGenerator(
  tree: Tree,
  schema: SetupFunctionsSchema
) {
  const tasks: GeneratorCallback[] = [];

  const options = normalizeOptions(tree, schema);

  createFiles(tree, options);
  createOrUpdateConfigFiles(tree, options);
  updateProjectConfig(tree, options);

  if (!options.skipPackageJson) {
    tasks.push(
      addDependenciesToPackageJson(
        tree,
        {
          esbuild: esbuildVersion,
        },
        {
          '@types/aws-lambda': awsLamdaTypesVersion,
        }
      )
    );
  }

  if (options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

export default setupFunctionsGenerator;
export const setupServerlessSchematic = convertNxGenerator(
  setupFunctionsGenerator
);
