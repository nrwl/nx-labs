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
} from '@nx/devkit';

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
  return {
    ...setupOptions,
    project,
    lintTarget: setupOptions.lintTarget ?? 'lint',
    serveTarget: setupOptions.serveTarget ?? 'serve',
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
    projectConfig.targets[`${options.serveTarget}`] = {
      command: 'npx netlify dev',
    };

    projectConfig.targets[`${options.deployTarget}`] = {
      dependsOn: [`${options.buildTarget}`, `${options.lintTarget}`],
      command: options.site
        ? `npx netlify deploy --site ${options.site}`
        : 'npx netlify deploy',
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
