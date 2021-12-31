import { RemixGeneratorSchema } from '../schema';
import { names, Tree } from '@nrwl/devkit';

export interface NormalizedSchema extends RemixGeneratorSchema {
  projectName: string;
  projectRoot: string;
  parsedTags: string[];
}

export function normalizeOptions(
  tree: Tree,
  options: RemixGeneratorSchema
): NormalizedSchema {
  // There is a bug in Nx core where custom preset args are not passed correctly for boolean values, thus causing the name to be "commit" or "nx-cloud" when not passed.
  // TODO(jack): revert this hack once Nx core is fixed for custom preset args.
  const name = names(
    options.project === 'commit' ||
      options.project === 'nx-cloud' ||
      !options.project
      ? 'webapp'
      : options.project
  ).fileName;
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
