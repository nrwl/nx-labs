import { formatFiles, Tree } from '@nrwl/devkit';
import {
  checkRoutePathForErrors,
  resolveRemixRouteFile,
} from '../../utils/remix-route-utils';
import actionGenerator from '../action/action.impl';
import loaderGenerator from '../loader/loader.impl';
import { RemixRouteSchema } from './schema';

export default async function (tree: Tree, options: RemixRouteSchema) {
  if (!options.skipChecks && checkRoutePathForErrors(options.path)) {
    throw new Error(
      `Your route path has an indicator of an un-escaped dollar sign for a route param. If this was intended, include the --skipChecks flag.`
    );
  }

  const routeFilePath = resolveRemixRouteFile(
    tree,
    options.path,
    options.project,
    '.ts'
  );

  if (tree.exists(routeFilePath))
    throw new Error(`Path already exists: ${options.path}`);

  if (!options.loader && !options.action)
    throw new Error(
      'The resource route generator requires either `loader` or `action` to be true'
    );

  tree.write(routeFilePath, '');

  if (options.loader) {
    await loaderGenerator(tree, {
      project: options.project,
      path: routeFilePath,
    });
  }

  if (options.action) {
    await actionGenerator(tree, {
      path: routeFilePath,
      project: options.project,
    });
  }

  await formatFiles(tree);
}
