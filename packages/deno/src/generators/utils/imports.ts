import {
  joinPathFragments,
  ProjectConfiguration,
  readJson,
  stripIndents,
  Tree,
  updateJson,
} from '@nrwl/devkit';
import { getRootTsConfigPathInTree, TsConfigPaths } from './ts-config';

interface ImportOptions {
  importPath: string;
  entryPoints: {
    /**
     * relative paths need to be prefixed with './' for deno to treat as a local file import
     */
    deno: string;
    node?: string;
  };
}

export function addImports(tree: Tree, options: ImportOptions) {
  if (!tree.exists('import_map.json')) {
    throw new Error(stripIndents`import_map.json does not exist in the root of the workspace.
      This means the workspace has not been initialized for Deno.
      You can do this by running 'nx g @nrwl/deno:init'`);
  }

  updateJson(tree, 'import_map.json', (json) => {
    json.imports = json.imports || {};
    if (json.imports[options.importPath]) {
      throw new Error(
        `Import path already exists in import_map.json for ${options.importPath}.
You can specify a different import path using the --import-path option.
The value needs to be unique and not already used in the import_map.json file.`
      );
    }
    json.imports[options.importPath] = options.entryPoints.deno.startsWith('./')
      ? options.entryPoints.deno
      : `./${options.entryPoints.deno}`;
    return json;
  });

  if (options.entryPoints.node) {
    const rootTsConfig = getRootTsConfigPathInTree(tree);
    if (!tree.exists(rootTsConfig)) {
      throw new Error(stripIndents`Could not find root tsconfig to add the import path to.
        This means a root level tsconfig.json or tsconfig.base.json file is not preset but is expected when using the --add-node-entrypoint flag`);
    }
    updateJson(tree, rootTsConfig, (json) => {
      json.compilerOptions.paths = json.compilerOptions?.paths || {};
      if (json.compilerOptions.paths[options.importPath]) {
        throw new Error(stripIndents`Import path already exists in ${rootTsConfig} for ${options.importPath}.
You can specify a different import path using the --import-path option.
The value needs to be unique and not already used in the ${rootTsConfig} file.`);
      }

      json.compilerOptions.paths[options.importPath] = [
        options.entryPoints.node.startsWith('./')
          ? options.entryPoints.node.slice(2)
          : options.entryPoints.node,
      ];

      return json;
    });
  }
}

export function getImportPathForProjectName(
  tree: Tree,
  projectConfig: ProjectConfiguration
) {
  const rootTsconfigPath = getRootTsConfigPathInTree(tree);
  if (!tree.exists(rootTsconfigPath)) {
    throw new Error(stripIndents`Could not find a root tsconfig.json or tsconfig.base.json to import paths from.
A root tsconfig is required in order to use an existing import path from another project.`);
  }

  const tsconfig = readJson<TsConfigPaths>(tree, rootTsconfigPath);
  if (!tsconfig?.compilerOptions?.paths) {
    throw new Error(`No paths found in ${rootTsconfigPath}`);
  }

  const paths = Object.entries(
    (tsconfig.compilerOptions.paths = tsconfig.compilerOptions?.paths || {})
  );

  for (const [importAlias, aliasedPath] of paths) {
    const foundImport = aliasedPath.find((p) => {
      const resolvedPath =
        !tsconfig.compilerOptions?.baseUrl ||
        tsconfig.compilerOptions?.baseUrl === '.'
          ? p
          : joinPathFragments(tsconfig.compilerOptions.baseUrl, p);

      const normalizedRoot = projectConfig.root.endsWith('/')
        ? projectConfig.root
        : `${projectConfig.root}/`;

      return resolvedPath.includes(normalizedRoot);
    });

    if (foundImport) {
      return {
        // import maps don't use * for deep imports, instead it's a /
        importAlias: importAlias.replace('/*', '/'),
        importPath: foundImport.replace('/*', '/'),
      };
    }
  }

  throw new Error(
    `Unable to find any import path in ${rootTsconfigPath} for project ${projectConfig.name}`
  );
}
