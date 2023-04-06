import {
  addDependenciesToPackageJson,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  logger,
  readNxJson,
  readProjectConfiguration,
  runTasksInSerial,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';

import { awsLamdaTypesVersion, esbuildVersion } from '../../../utils/version';

import { Schema } from './schema';

interface NormalizedSchema extends Schema {
  projectName: string;
}

function normalizeOptions(tree: Tree, schema: Schema): NormalizedSchema {
  const projectName = schema.name ?? readNxJson(tree).defaultProject;
  return {
    ...schema,
    projectName,
    serveTarget: schema.serveTarget ?? 'serve',
    deployTarget: schema.deployTarget ?? 'deploy',
  };
}

function addAwsLamdaFiles(tree: Tree, options: NormalizedSchema) {
  const { projectName } = options;
  const projectConfig = readProjectConfiguration(tree, projectName);
  if (!projectConfig) {
    return;
  }

  if (tree.exists(joinPathFragments(projectConfig.root, 'samconfig.toml'))) {
    logger.info(
      `Skipping setup since a samconfig.toml already exists inside ${projectConfig.root}`
    );
  } else {
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
}

function updateProjectConfig(tree: Tree, options: NormalizedSchema) {
  const projectConfig = readProjectConfiguration(tree, options.projectName);

  if (projectConfig) {
    projectConfig.targets[`${options.serveTarget}`] = {
      command: 'sam build && sam local invoke',
    };

    projectConfig.targets[`${options.deployTarget}`] = {
      command: 'sam build && sam deploy --guided',
    };

    updateProjectConfiguration(tree, options.projectName, projectConfig);
  }
}

export async function setupServerlessGenerator(tree: Tree, schema: Schema) {
  const tasks: GeneratorCallback[] = [];

  const options = normalizeOptions(tree, schema);

  addAwsLamdaFiles(tree, options);
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

export default setupServerlessGenerator;
export const setupServerlessSchematic = convertNxGenerator(
  setupServerlessGenerator
);
