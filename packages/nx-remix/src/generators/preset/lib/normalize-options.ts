import { NxRemixGeneratorSchema } from '../schema';
import { names, Tree } from '@nrwl/devkit';

export interface NormalizedSchema extends NxRemixGeneratorSchema {
  projectName: string;
  projectRoot: string;
  parsedTags: string[];
}

export function normalizeOptions(
  tree: Tree,
  options: NxRemixGeneratorSchema
): NormalizedSchema {
  const name = names(options.project).fileName;
  const projectName = name;
  const projectRoot = `packages/${name}`;
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
