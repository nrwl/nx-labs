import { Tree } from '@nrwl/devkit';
import { getRemixFutureFlags } from '../../../utils/remix-config';
import { MetaSchema } from '../schema';

export function normalizeOptions(tree: Tree, options: MetaSchema): MetaSchema {
  let normalizedVersion = options.version;

  if (!normalizedVersion) {
    // is the v2 future flag enabled?
    const futureFlags = getRemixFutureFlags(tree, options.project);

    normalizedVersion = futureFlags?.v2_meta ? '2' : '1';
  }

  return {
    ...options,
    version: normalizedVersion,
  };
}
