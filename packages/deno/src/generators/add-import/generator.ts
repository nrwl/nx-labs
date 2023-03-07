import {
  formatFiles,
  getImportPath,
  getWorkspaceLayout,
  readProjectConfiguration,
  Tree,
} from '@nrwl/devkit';
import { addImports, getImportPathForProjectName } from '../utils/imports';
import { AddImportGeneratorSchema } from './schema';

function normalizeOptions(tree: Tree, options: AddImportGeneratorSchema) {
  const layout = getWorkspaceLayout(tree);

  return {
    ...options,
    projectConfig: readProjectConfiguration(tree, options.project),
    importPath:
      options.importPath || getImportPath(layout.npmScope, options.project),
  };
}

export default async function (tree: Tree, options: AddImportGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  const existingImportPath = getImportPathForProjectName(
    tree,
    normalizedOptions.projectConfig
  );

  addImports(tree, {
    entryPoints: { deno: existingImportPath.importPath },
    importPath: existingImportPath.importAlias,
  });

  await formatFiles(tree);
}
