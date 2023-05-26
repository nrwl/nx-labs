import { formatFiles, type Tree } from '@nx/devkit';
import {
  addV1ErrorBoundary,
  addV2ErrorBoundary,
  normalizeOptions,
} from './lib';
import type { ErrorBoundarySchema } from './schema';

export default async function errorBoundaryGenerator(
  tree: Tree,
  schema: ErrorBoundarySchema
) {
  const options = normalizeOptions(tree, schema);

  if (options.apiVersion === 1) {
    addV1ErrorBoundary(tree, options);
  } else {
    addV2ErrorBoundary(tree, options);
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
}
