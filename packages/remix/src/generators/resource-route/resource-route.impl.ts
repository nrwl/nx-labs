import { formatFiles, Tree } from '@nrwl/devkit';
import { RemixRouteSchema } from './schema';
import loaderGenerator from '../loader/loader.impl';
import actionGenerator from '../action/action.impl';
import { resolveRemixRouteFile } from '../../utils/remix-route-utils';

export default async function (tree: Tree, options: RemixRouteSchema) {
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
