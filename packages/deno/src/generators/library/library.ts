import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getImportPath,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  ProjectConfiguration,
  Tree,
} from '@nx/devkit';
import { join } from 'path';
import { initDeno } from '../init/generator';
import { addPathToDenoSettings } from '../utils/add-path';
import { addImports } from '../utils/imports';
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
  const layout = getWorkspaceLayout(tree);
  // prevent paths from being dist/./lib-name
  const projectRoot = joinPathFragments(
    layout.libsDir === '.' ? '' : layout.libsDir,
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
    addNodeEntrypoint: options.addNodeEntrypoint ?? false,
    importPath:
      options.importPath || getImportPath(layout.npmScope, projectName),
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
    hasUnitTestRunner: options.unitTestRunner !== 'none',
    cliCommand: 'nx',
  };
  generateFiles(
    tree,
    join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );

  if (!options.addNodeEntrypoint) {
    tree.delete(`${options.projectRoot}/node.ts`);
  }
}

function addProjectConfig(tree: Tree, opts: NormalizedSchema) {
  const targets: ProjectConfiguration['targets'] = {
    test: {
      executor: '@nx/deno:test',
      outputs: [`coverage/${opts.projectRoot}`],
      options: {
        coverageDirectory: `coverage/${opts.projectRoot}`,
        denoConfig: `${opts.projectRoot}/deno.json`,
        check: 'local',
      },
    },
    lint: {
      executor: '@nx/deno:lint',
      options: {
        denoConfig: `${opts.projectRoot}/deno.json`,
      },
    },
  };

  if (opts.unitTestRunner === 'none') {
    delete targets.test;
  }

  if (opts.linter === 'none') {
    delete targets.lint;
  }

  addProjectConfiguration(tree, opts.projectName, {
    name: opts.projectName,
    root: opts.projectRoot,
    sourceRoot: opts.projectRoot,
    projectType: 'library',
    targets,
    tags: opts.parsedTags,
  });
}

export async function denoLibraryGenerator(
  tree: Tree,
  options: LibraryGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);

  initDeno(tree);
  addProjectConfig(tree, normalizedOptions);
  addFiles(tree, normalizedOptions);
  addImports(tree, {
    importPath: normalizedOptions.importPath,
    entryPoints: {
      deno: `./${joinPathFragments(normalizedOptions.projectRoot, 'mod.ts')}`,
      node: normalizedOptions.addNodeEntrypoint
        ? `${joinPathFragments(normalizedOptions.projectRoot, 'node.ts')}`
        : undefined,
    },
  });
  addPathToDenoSettings(tree, normalizedOptions.projectRoot);

  await formatFiles(tree);
}

export default denoLibraryGenerator;
