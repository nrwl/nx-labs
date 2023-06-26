import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
  writeJson,
} from '@nx/devkit';
import { join, relative } from 'path';
import initDeno from '../init/generator';
import denoSetupFunctions from '../setup-functions/setup-functions';
import { ServerlessGeneratorSchema } from './schema';

type NormalizedSchema = ReturnType<typeof normalizeOptions>;

export async function denoServerlessGenerator(
  tree: Tree,
  options: ServerlessGeneratorSchema
) {
  const opts = normalizeOptions(tree, options);

  await initDeno(tree);
  addProject(tree, opts);
  addFiles(tree, opts);
  const setupTask = await setupDeployConfig(tree, opts);

  await formatFiles(tree);

  return setupTask;
}

function normalizeOptions(tree: Tree, options: ServerlessGeneratorSchema) {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;
  const rootProject = projectRoot === '.' || projectRoot === '';
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  options.platform ??= 'none';
  options.linter ??= 'deno';
  options.unitTestRunner ??= 'deno';

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    rootProject,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const projectConfig = readProjectConfiguration(tree, options.projectName);
  const offset = offsetFromRoot(options.projectRoot);
  const templateOptions = {
    ...options,
    ...names(options.name),
    srcDir: relative(projectConfig.root, projectConfig.sourceRoot),
    tmpl: '',
    offset,
  };
  generateFiles(
    tree,
    join(__dirname, 'files', `platform-${options.platform}`),
    options.projectRoot,
    templateOptions
  );

  writeJson(tree, joinPathFragments(options.projectRoot, 'deno.json'), {
    importMap: `${offset}import_map.json`,
  });
}

export function addProject(tree: Tree, opts: NormalizedSchema) {
  const coverageDirectory = joinPathFragments(
    'coverage',
    opts.rootProject ? opts.name : opts.projectRoot
  );

  const targets: ProjectConfiguration['targets'] = {
    build: {
      executor: '@nx/deno:emit',
      outputs: [
        joinPathFragments(
          'dist',
          opts.rootProject ? opts.name : opts.projectRoot
        ),
      ],
      options: {
        main: joinPathFragments(opts.projectRoot, 'src/main.ts'),
        outputFile: joinPathFragments(
          'dist',
          opts.rootProject ? opts.name : opts.projectRoot,
          'main.js'
        ),
        denoConfig: joinPathFragments(opts.projectRoot, 'deno.json'),
      },
    },
    serve: {
      executor: '@nx/deno:run',
      options: {
        buildTarget: `${opts.projectName}:build`,
      },
    },
    test: {
      executor: '@nx/deno:test',
      outputs: [coverageDirectory],
      options: {
        coverageDirectory,
        denoConfig: joinPathFragments(opts.projectRoot, 'deno.json'),
        allowNone: true,
      },
    },
    lint: {
      executor: '@nx/deno:lint',
      options: {
        denoConfig: joinPathFragments(opts.projectRoot, 'deno.json'),
      },
    },
  };

  if (opts.platform === 'netlify') {
    // No reason to build on netlify as the project sourceRoot is the direct script ran
    delete targets.build;
  }

  if (opts.linter === 'none') {
    delete targets.lint;
  }

  if (opts.unitTestRunner === 'none') {
    delete targets.test;
  }

  addProjectConfiguration(tree, opts.projectName, {
    root: opts.projectRoot,
    projectType: 'application',
    name: opts.projectName,
    sourceRoot: joinPathFragments(opts.projectRoot, 'src'),
    targets,
    tags: opts.parsedTags,
  });
}

async function setupDeployConfig(tree: Tree, opts: NormalizedSchema) {
  const setupTask = await denoSetupFunctions(tree, {
    project: opts.projectName,
    platform: opts.platform,
  });
  // delete fn folder from setup-functions
  tree.delete(joinPathFragments(opts.projectRoot, 'functions'));

  const projectConfig = readProjectConfiguration(tree, opts.projectName);

  if (projectConfig.targets?.['serve-functions']) {
    projectConfig.targets.serve = projectConfig.targets['serve-functions'];
    delete projectConfig.targets['serve-functions'];
  }

  updateProjectConfiguration(tree, opts.projectName, projectConfig);

  return setupTask;
}

export default denoServerlessGenerator;
