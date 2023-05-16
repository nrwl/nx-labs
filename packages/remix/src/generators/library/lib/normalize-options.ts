import type { Tree } from '@nx/devkit';
import { extractLayoutDirectory, getWorkspaceLayout, names } from '@nx/devkit';
import { getImportPath } from '@nx/js/src/utils/get-import-path';
import {
  normalizeDirectory,
  normalizeProjectName,
} from '../../../utils/project';
import type { NxRemixGeneratorSchema } from '../schema';

export interface RemixLibraryOptions extends NxRemixGeneratorSchema {
  projectName: string;
}

export function normalizeOptions(
  tree: Tree,
  options: NxRemixGeneratorSchema
): RemixLibraryOptions {
  const name = names(options.name).fileName;

  const { projectDirectory } = extractLayoutDirectory(options.directory);
  const fullProjectDirectory = normalizeDirectory(name, projectDirectory);
  const { npmScope } = getWorkspaceLayout(tree);

  const importPath =
    options.importPath ?? getImportPath(tree, fullProjectDirectory);

  const projectName = normalizeProjectName(name, projectDirectory);

  return {
    ...options,
    name,
    importPath,
    projectName,
  };
}
