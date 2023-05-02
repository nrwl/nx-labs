import {
  addProjectConfiguration,
  generateFiles,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  Tree,
} from '@nx/devkit';
import { join } from 'path';
import { DenoAppGeneratorSchema, DenoAppNormalizedSchema } from './schema';

export function normalizeOptions(
  tree: Tree,
  options: DenoAppGeneratorSchema
): DenoAppNormalizedSchema {
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

  options.framework ??= 'none';

  return {
    ...options,
    rootProject,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

export function addFiles(tree: Tree, options: DenoAppNormalizedSchema) {
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
    join(__dirname, 'files', 'root-files'),
    options.projectRoot,
    templateOptions
  );

  generateFiles(
    tree,
    join(__dirname, 'files', `framework-${options.framework}`),
    join(options.projectRoot, 'src'),
    templateOptions
  );
}

export function addProjectConfig(tree: Tree, opts: DenoAppNormalizedSchema) {
  const coverageDirectory = joinPathFragments(
    'coverage',
    opts.rootProject ? opts.name : opts.projectRoot
  );
  const targets: ProjectConfiguration['targets'] = {
    build: {
      executor: '@nrwl/deno:emit',
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
