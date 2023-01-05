import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getImportPath,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  Tree,
  updateJson,
} from '@nrwl/devkit';
import * as path from 'path';
import { initDeno } from '../init/generator';
import { addPathToDenoSettings } from '../utils/add-path';
import { LibraryGeneratorSchema } from './schema';

interface NormalizedSchema extends LibraryGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  tree: Tree,
  options: LibraryGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;
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
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );
}

export async function denoLibraryGenerator(
  tree: Tree,
  options: LibraryGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);
  initDeno(tree);
  const targets = {
    test: {
      executor: '@nrwl/deno:test',
      outputs: [`coverage/${normalizedOptions.projectRoot}`],
      options: {
        coverageDirectory: `coverage/${normalizedOptions.projectRoot}`,
        denoConfig: `${normalizedOptions.projectRoot}/deno.json`,
        check: 'local',
      },
    },
    lint: {
      executor: '@nrwl/deno:lint',
      options: {
        denoConfig: `${normalizedOptions.projectRoot}/deno.json`,
      },
    },
  };

  if (normalizedOptions.unitTestRunner === 'none') {
    delete targets.test;
  }

  if (normalizedOptions.linter === 'none') {
    delete targets.lint;
  }

  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'library',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets,
    tags: normalizedOptions.parsedTags,
  });
  addFiles(tree, normalizedOptions);
  updateImportMap(tree, normalizedOptions);
  addPathToDenoSettings(tree, normalizedOptions.projectRoot);
  await formatFiles(tree);
}

function updateImportMap(tree: Tree, options: NormalizedSchema) {
  const { npmScope } = getWorkspaceLayout(tree);
  updateJson(tree, 'import_map.json', (json) => {
    const importPath = getImportPath(npmScope, options.projectName);
    json.imports = json.imports || {};
    if (json.imports[importPath]) {
      throw new Error(
        'Import path already exists in import_map.json for ${importPath}'
      );
    }
    // NOTE relative paths need to be prefixed with './' for deno to treat as a local file import
    json.imports[importPath] = `./${joinPathFragments(
      options.projectRoot,
      'src',
      'index.ts'
    )}`;
    return json;
  });
}

export default denoLibraryGenerator;
