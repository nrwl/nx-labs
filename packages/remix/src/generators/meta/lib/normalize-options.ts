import { Tree } from '@nx/devkit';
import { determineArtifactNameAndDirectoryOptions } from '@nx/devkit/src/generators/artifact-name-and-directory-utils';
import { getRemixFutureFlags } from '../../../utils/remix-config';
import { MetaSchema } from '../schema';

export async function normalizeOptions(
  tree: Tree,
  options: MetaSchema
): Promise<MetaSchema> {
  const { project } = await determineArtifactNameAndDirectoryOptions(tree, {
    artifactType: 'meta',
    callingGenerator: '@nx/remix:meta',
    name: options.path,
    nameAndDirectoryFormat: options.nameAndDirectoryFormat,
    project: options.project,
  });
  let normalizedVersion = options.version;

  if (!normalizedVersion) {
    // is the v2 future flag enabled?
    const futureFlags = getRemixFutureFlags(tree, project);

    normalizedVersion = futureFlags?.v2_meta ? '2' : '1';
  }

  return {
    ...options,
    version: normalizedVersion,
  };
}
