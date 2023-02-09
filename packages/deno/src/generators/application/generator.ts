import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
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
  const projectRoot = `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`;
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

export default async function (
  tree: Tree,
  options: ApplicationGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);
  initDeno(tree);
  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
    name: normalizedOptions.projectName,
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: {
      build: {
        executor: '@nrwl/deno:build',
        outputs: [`dist/${normalizedOptions.projectRoot}`],
        options: {
          main: `${normalizedOptions.projectRoot}/src/main.ts`,
          outputFile: `dist/${normalizedOptions.projectRoot}/main.js`,
          denoConfig: `${normalizedOptions.projectRoot}/deno.json`,
        },
      },
      serve: {
        executor: '@nrwl/deno:serve',
        options: {
          buildTarget: `${normalizedOptions.projectName}:build`,
        },
      },
      test: {
        executor: '@nrwl/deno:test',
        outputs: [`coverage/${normalizedOptions.projectRoot}`],
        options: {
          coverageDirectory: `coverage/${normalizedOptions.projectRoot}`,
          denoConfig: `${normalizedOptions.projectRoot}/deno.json`,
        },
      },
      lint: {
        executor: '@nrwl/deno:lint',
        options: {
          denoConfig: `${normalizedOptions.projectRoot}/deno.json`,
        },
      },
    },
    tags: normalizedOptions.parsedTags,
  });
  addFiles(tree, normalizedOptions);
  addPathToDenoSettings(tree, normalizedOptions.projectRoot);
  await formatFiles(tree);
}
