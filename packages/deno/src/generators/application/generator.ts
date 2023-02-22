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
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const appDir = getWorkspaceLayout(tree).appsDir;
  // prevent paths from being dist/./app-name
  const projectRoot = joinPathFragments(
    appDir === '.' ? '' : appDir,
    projectDirectory
  );
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
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
  const targets: ProjectConfiguration['targets'] = {
    build: {
      executor: '@nrwl/deno:bundle',
      outputs: [`dist/${opts.projectRoot}`],
      options: {
        main: `${opts.projectRoot}/src/main.ts`,
        outputFile: `dist/${opts.projectRoot}/main.js`,
        denoConfig: `${opts.projectRoot}/deno.json`,
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
      outputs: [`coverage/${opts.projectRoot}`],
      options: {
        coverageDirectory: `coverage/${opts.projectRoot}`,
        denoConfig: `${opts.projectRoot}/deno.json`,
      },
    },
    lint: {
      executor: '@nrwl/deno:lint',
      options: {
        denoConfig: `${opts.projectRoot}/deno.json`,
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
    sourceRoot: `${opts.projectRoot}/src`,
    targets,
    tags: opts.parsedTags,
  });
}

export default async function (
  tree: Tree,
  options: ApplicationGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);

  initDeno(tree);
  addProjectConfig(tree, normalizedOptions);
  addFiles(tree, normalizedOptions);
  addPathToDenoSettings(tree, normalizedOptions.projectRoot);

  await formatFiles(tree);
}
