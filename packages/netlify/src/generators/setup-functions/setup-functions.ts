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
  stripIndents,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';

import {
  netlifyCliVersion,
  netlifyFunctionVersion,
} from '../../../utils/versions';
import { SetupFunctionsSchema } from './schema';

function normalizeOptions(tree: Tree, setupOptions: SetupFunctionsSchema) {
  const project = setupOptions.project ?? readNxJson(tree).defaultProject;
  return {
    ...setupOptions,
    project,
    serveTarget: setupOptions.serveTarget ?? 'serve-functions',
    deployTarget: setupOptions.deployTarget ?? 'deploy-functions',
  };
}

function createFiles(tree: Tree, options: SetupFunctionsSchema) {
  const project = readProjectConfiguration(tree, options.project);
  generateFiles(tree, joinPathFragments(__dirname, `./files`), project.root, {
    tmpl: '',
  });

  const indexHtml = joinPathFragments(project.root, 'public/index.html');
  if (!tree.exists(indexHtml)) {
    tree.write(
      indexHtml,
      stripIndents`
        <h1>Netlify Functions</h1>
        <p>The sample function is available at <a href="/.netlify/functions/hello"><code>/.netlify/functions/hello</code></a>.</p>
      `
    );
  }
}

async function addTargets(tree: Tree, options: SetupFunctionsSchema) {
  const projectConfig = readProjectConfiguration(tree, options.project);
  const isRootProject = projectConfig.root === '.';
  projectConfig.targets ??= {};

  if (projectConfig) {
    if (projectConfig.targets?.lint) {
      projectConfig.targets.lint.options.lintFilePatterns = [
        ...(projectConfig.targets.lint.options.lintFilePatterns || []),
        './functions/**/*.ts',
      ];
    }
    projectConfig.targets[`${options.serveTarget}`] = {
      command: 'npx netlify dev',
    };

    projectConfig.targets[`${options.deployTarget}`] = {
      dependsOn: projectConfig.targets?.['lint'] ? ['lint'] : [],
      command: options.site
        ? `npx netlify deploy --site ${options.site}`
        : 'npx netlify deploy',
      options: isRootProject
        ? undefined
        : {
            cwd: projectConfig.root,
          },
      configurations: {
        production: {
          command: options.site
            ? `npx netlify deploy --site ${options.site} --prod`
            : 'npx netlify deploy --prod',
          cwd: isRootProject ? undefined : projectConfig.root,
        },
      },
    };

    updateProjectConfiguration(tree, options.project, projectConfig);
  }
}

function createOrUpdateNetlifyToml(tree: Tree, options: SetupFunctionsSchema) {
  const project = readProjectConfiguration(tree, options.project);
  const filePath = joinPathFragments(project.root, 'netlify.toml');

  const buildContent = tree.exists(filePath)
    ? tree.read(filePath).toString('utf-8')
    : stripIndents`
      [build]
      # Static files from this folder will be served at the root of the site.
      publish = "public"
    `;

  const fnsContent = stripIndents`
    [functions]
    # Directory with serverless functions, including background
    # functions, to deploy. This is relative to the base directory
    # if one has been set, or the root directory if
    # a base hasn’t been set.
    directory = "functions/"

    # Specifies \`esbuild\` for functions bundling, esbuild is the default for TS
    # node_bundler = "esbuild"

    [functions."hello*"]
    # Apply settings to any functions with a name beginning with "hello"
  `;

  tree.write(filePath, `${buildContent}\n${fnsContent}`);
}

export async function setupFunctionsGenerator(
  tree: Tree,
  setupOptions: SetupFunctionsSchema
) {
  const tasks: GeneratorCallback[] = [];
  const options = normalizeOptions(tree, setupOptions);

  createFiles(tree, options);
  createOrUpdateNetlifyToml(tree, options);
  await addTargets(tree, options);

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

export default setupFunctionsGenerator;
export const setupServerlessSchematic = convertNxGenerator(
  setupFunctionsGenerator
);
