import { getWorkspaceLayout, joinPathFragments, names, Tree } from '@nx/devkit';
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
  const { appsDir } = getWorkspaceLayout(tree);
  const name = names(options.name).fileName;
  const projectName = name;
  const projectRoot = options.rootProject
    ? '.'
    : joinPathFragments(appsDir, name);
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
