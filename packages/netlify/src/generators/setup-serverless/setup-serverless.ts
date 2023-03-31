import {
  addDependenciesToPackageJson,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  logger,
  names,
  readNxJson,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import {
  netlifyCliVersion,
  netlifyFunctionVersion,
} from '../../../utils/versions';
import { SetupServerlessFunctionOptions } from './schema';

function normalizeOptions(
  tree: Tree,
  setupOptions: SetupServerlessFunctionOptions
) {
  const project = setupOptions.project ?? readNxJson(tree).defaultProject;
  const siteName = names(project).fileName;
  return {
    ...setupOptions,
    project,
    site: setupOptions.site ?? siteName,
    lintTarget: setupOptions.lintTarget ?? 'lint',
    devTarget: setupOptions.devTarget ?? 'dev',
    buildTarget: setupOptions.buildTarget ?? 'build',
    deployTarget: setupOptions.deployTarget ?? 'deploy',
  };
}

function addServerlessFiles(
  tree: Tree,
  options: SetupServerlessFunctionOptions
) {
  const project = readProjectConfiguration(tree, options.project);
  if (!options.project || !options.deployTarget) {
    return;
  }

  if (tree.exists(joinPathFragments(project.root, 'netlify.toml'))) {
    logger.info(
      `Skipping setup since a netlify.toml already exists inside ${project.root}`
    );
  } else {
    const outputPath =
      project.targets[`${options.buildTarget}`]?.options.outputPath;
    generateFiles(tree, joinPathFragments(__dirname, `./files`), project.root, {
      tmpl: '',
      app: project.sourceRoot,
      outputPath,
    });
  }
}

function updateProjectConfig(
  tree: Tree,
  options: SetupServerlessFunctionOptions
) {
  const projectConfig = readProjectConfiguration(tree, options.project);

  if (projectConfig) {
    projectConfig.targets[`${options.buildTarget}`].options.bundle = true;
    projectConfig.targets[`${options.devTarget}`] = {
      command: 'npx netlify dev',
    };

    projectConfig.targets[`${options.deployTarget}`] = {
      dependsOn: [`${options.lintTarget}`],
      command: 'npx netlify deploy --prod-if-unlocked',
    };

    updateProjectConfiguration(tree, options.project, projectConfig);
  }
}

export async function setupServerlessGenerator(
  tree: Tree,
  setupOptions: SetupServerlessFunctionOptions
) {
  const tasks: GeneratorCallback[] = [];
  const options = normalizeOptions(tree, setupOptions);

  addServerlessFiles(tree, options);
  updateProjectConfig(tree, options);

  if (!options.skipPackageJson) {
    tasks.push(
      addDependenciesToPackageJson(
        tree,
        {},
        {
          '@netlify/functions': netlifyFunctionVersion,
          'netlify-cli': netlifyCliVersion,
        }
      )
    );
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

export default setupServerlessGenerator;
export const setupServerlessSchematic = convertNxGenerator(
  setupServerlessGenerator
);
