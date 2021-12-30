import {RemixGeneratorSchema} from '../schema';
import {names, Tree} from '@nrwl/devkit';

export interface NormalizedSchema extends RemixGeneratorSchema {
  projectName: string;
  projectRoot: string;
  parsedTags: string[];
}

export function normalizeOptions(
  tree: Tree,
  options: RemixGeneratorSchema
): NormalizedSchema {
  const name = names(options.project ?? 'webapp').fileName;
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
