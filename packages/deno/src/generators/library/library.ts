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
  stripIndents,
  Tree,
  updateJson,
} from '@nrwl/devkit';
import { join } from 'path';
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
      executor: '@nrwl/deno:test',
      outputs: [`coverage/${opts.projectRoot}`],
      options: {
        coverageDirectory: `coverage/${opts.projectRoot}`,
        denoConfig: `${opts.projectRoot}/deno.json`,
        check: 'local',
      },
    },
    lint: {
      executor: '@nrwl/deno:lint',
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
  addImports(tree, normalizedOptions);
  addPathToDenoSettings(tree, normalizedOptions.projectRoot);

  await formatFiles(tree);
}

function addImports(tree: Tree, options: NormalizedSchema) {
  updateJson(tree, 'import_map.json', (json) => {
    json.imports = json.imports || {};
    if (json.imports[options.importPath]) {
      throw new Error(
        `Import path already exists in import_map.json for ${options.importPath}.
You can specify a different import path using the --import-path option.
The value needs to be unique and not already used in the import_map.json file.`
      );
    }
    // NOTE relative paths need to be prefixed with './' for deno to treat as a local file import
    json.imports[options.importPath] = `./${joinPathFragments(
      options.projectRoot,
      'mod.ts'
    )}`;
    return json;
  });

  if (options.addNodeEntrypoint) {
    const rootTsConfig = getRootTsConfigPathInTree(tree);
    if (!tree.exists(rootTsConfig)) {
      throw new Error(stripIndents`Could not find root tsconfig to add the import path to.
        This means a root level tsconfig.json or tsconfig.base.json file is not preset but is expected when using the --add-node-entrypoint flag`);
    }
    updateJson(tree, rootTsConfig, (json) => {
      if (json.imports[options.importPath]) {
        throw new Error(stripIndents`Import path already exists in ${rootTsConfig} for ${options.importPath}.
You can specify a different import path using the --import-path option.
The value needs to be unique and not already used in the ${rootTsConfig} file.`);
      }
      return json;
    });
  }
}

// TODO(caleb): switch to @nrwl/js version once we update and make it a dep
function getRootTsConfigPathInTree(tree: Tree): string | null {
  for (const path of ['tsconfig.base.json', 'tsconfig.json']) {
    if (tree.exists(path)) {
      return path;
    }
  }

  return 'tsconfig.base.json';
}
export default denoLibraryGenerator;
