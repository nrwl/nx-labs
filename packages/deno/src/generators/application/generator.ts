import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  Tree,
} from '@nrwl/devkit';
import { join } from 'path';
import { initDeno } from '../init/generator';
import { addPathToDenoSettings } from '../utils/add-path';
import { ApplicationGeneratorSchema } from './schema';

interface NormalizedSchema extends ApplicationGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  tree: Tree,
  options: ApplicationGeneratorSchema
): NormalizedSchema {
  // --monorepo takes precedence over --rootProject
  // This is for running `create-nx-workspace --preset=@nrwl/deno --monorepo`
  const rootProject = !options.monorepo && options.rootProject;

  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const appDir = getWorkspaceLayout(tree).appsDir;
  // prevent paths from being dist/./app-name
  const projectRoot = rootProject
    ? '.'
    : joinPathFragments(appDir === '.' ? '' : appDir, projectDirectory);
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    rootProject,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    importMapPath: joinPathFragments(
      offsetFromRoot(options.projectRoot),
      'import_map.json'
    ),
    template: '',
  };
  generateFiles(
    tree,
    join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

function addProjectConfig(tree: Tree, opts: NormalizedSchema) {
  const coverageDirectory = joinPathFragments(
    'coverage',
    opts.rootProject ? opts.name : opts.projectRoot
  );
  const targets: ProjectConfiguration['targets'] = {
    build: {
      executor: '@nrwl/deno:bundle',
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
      executor: '@nrwl/deno:run',
      options: {
        buildTarget: `${opts.projectName}:build`,
      },
    },
    test: {
      executor: '@nrwl/deno:test',
      outputs: [coverageDirectory],
      options: {
        coverageDirectory,
        denoConfig: joinPathFragments(opts.projectRoot, 'deno.json'),
      },
    },
    lint: {
      executor: '@nrwl/deno:lint',
      options: {
        denoConfig: joinPathFragments(opts.projectRoot, 'deno.json'),
      },
    },
  };

  if (opts.withWatch === true) {
    targets.serve.options.watch = true;
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

export default async function (
  tree: Tree,
  options: ApplicationGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);

  await initDeno(tree);
  addProjectConfig(tree, normalizedOptions);
  addFiles(tree, normalizedOptions);
  addPathToDenoSettings(tree, normalizedOptions.projectRoot);

  await formatFiles(tree);
}
