import {
  extractLayoutDirectory,
  getWorkspaceLayout,
  joinPathFragments,
  Tree,
} from '@nx/devkit';
import {
  normalizeDirectory,
  normalizeProjectName,
} from '../../../utils/project';
import { NxRemixGeneratorSchema } from '../schema';

export interface NormalizedSchema extends NxRemixGeneratorSchema {
  projectName: string;
  projectRoot: string;
  parsedTags: string[];
}

export function normalizeOptions(
  tree: Tree,
  options: NxRemixGeneratorSchema
): NormalizedSchema {
  const { layoutDirectory, projectDirectory } = extractLayoutDirectory(
    options.directory
  );
  const appDirectory = normalizeDirectory(options.name, projectDirectory);
  const appName = normalizeProjectName(options.name, projectDirectory);
  const { appsDir: defaultAppsDir } = getWorkspaceLayout(tree);
  const appsDir = layoutDirectory ?? defaultAppsDir;
  const projectName = appName;
  const projectRoot = options.rootProject
    ? '.'
    : joinPathFragments(appsDir, appDirectory);
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    parsedTags,
  };
}
