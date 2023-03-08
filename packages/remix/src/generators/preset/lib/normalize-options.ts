import { names, Tree } from '@nrwl/devkit';
import { RemixGeneratorSchema } from '../schema';

export interface NormalizedSchema extends RemixGeneratorSchema {
  appName: string;
  projectRoot: string;
  parsedTags: string[];
}

export function normalizeOptions(
  tree: Tree,
  options: RemixGeneratorSchema
): NormalizedSchema {
  // There is a bug in Nx core where custom preset args are not passed correctly for boolean values, thus causing the name to be "commit" or "nx-cloud" when not passed.
  // TODO(jack): revert this hack once Nx core is fixed for custom preset args.
  // TODO(philip): presets should probably be using the `appName` flag to name the app, but it's not getting passed down to this generator properly and is always an empty string
  const name = names(
    !options.remixAppName ? 'webapp' : options.remixAppName
  ).fileName;
  const appName = name;
  const projectRoot = `packages/${name}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    appName,
    projectRoot,
    parsedTags,
  };
}
