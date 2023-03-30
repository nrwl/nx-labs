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
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { awsLamdaTypesVersion, esbuildVersion } from '../../utils/version';

import { Schema } from './schema';

interface NormalizedSchema extends Schema {
  projectName: string;
}

function normalizeOptions(tree: Tree, schema: Schema): NormalizedSchema {
  const projectName = schema.name ?? readNxJson(tree).defaultProject;
  return {
    ...schema,
    projectName,
    devTarget: schema.devTarget ?? 'dev',
    buildTarget: schema.buildTarget ?? 'build',
    deployTarget: schema.deployTarget ?? 'deploy',
  };
}

function addAwsLamdaFiles(tree: Tree, options: NormalizedSchema) {
  const { projectName } = options;
  const projectConfig = readProjectConfiguration(tree, projectName);
  if (!projectConfig || !options.buildTarget) {
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
    projectConfig.targets[`${options.buildTarget}`].options.bundle = true;
    projectConfig.targets[`${options.devTarget}`] = {
      command: 'sam build && sam local invoke',
    };

    projectConfig.targets[`${options.deployTarget}`] = {
      dependsOn: [`${options.buildTarget}`],
      command: 'sam deploy --guided',
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
