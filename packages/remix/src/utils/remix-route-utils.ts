import {
  joinPathFragments,
  names,
  readProjectConfiguration,
  Tree,
} from '@nrwl/devkit';

/**
 *
 * @param tree
 * @param path to the route which could be fully specified or just "foo/bar"
 * @param projectName the name of the project where the route should be added
 * @returns file path to the route
 */
export function resolveRemixRouteFile(
  tree: Tree,
  path: string,
  projectName: string
): string {
  const project = readProjectConfiguration(tree, projectName);
  if (!project) throw new Error(`Project does not exist: ${projectName}`);
  const { fileName: routePath } = names(
    path.replace(/^\//, '').replace(/\/$/, '')
  );
  const normalizedRoutePath = normalizeRoutePath(routePath, project.root);

  const fileName = normalizedRoutePath.endsWith('.tsx')
    ? normalizedRoutePath
    : `${normalizedRoutePath}.tsx`;

  // TODO: what if someone changes the Remix app root folder in the remix.config.js?
  const routeFilePath = joinPathFragments(project.root, 'app/routes', fileName);

  return routeFilePath;
}

function normalizeRoutePath(path: string, projectRoot: string) {
  if (path.indexOf(projectRoot) === -1) return path;
  if (path.indexOf('/routes/') > -1)
    return path.substring(path.indexOf('/routes/') + 8);
  return path.substring(projectRoot.length + 1);
}
