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
 * @param fileExtension the file extension to add to resolved route file
 * @returns file path to the route
 */
export function resolveRemixRouteFile(
  tree: Tree,
  path: string,
  projectName: string,
  fileExtension?: string
): string {
  const project = readProjectConfiguration(tree, projectName);
  if (!project) throw new Error(`Project does not exist: ${projectName}`);
  const { name: routePath } = names(path.replace(/^\//, '').replace(/\/$/, ''));
  const normalizedRoutePath = normalizeRoutePath(routePath);

  // if no file extension specified, let's try to find it
  if (!fileExtension) {
    // see if the path already has it
    const extensionMatch = path.match(/(\.[^.]+)$/);

    if (extensionMatch) {
      fileExtension = extensionMatch[0];
    } else {
      // look for either .ts or .tsx to exist in tree
      if (tree.exists(`${normalizedRoutePath}.ts`)) {
        fileExtension = '.ts';
      } else {
        // default to .tsx if nothing else found
        fileExtension = '.tsx';
      }
    }
  }

  const fileName = normalizedRoutePath.endsWith(fileExtension)
    ? normalizedRoutePath
    : `${normalizedRoutePath}${fileExtension}`;

  return joinPathFragments(
    resolveRemixAppDirectory(tree, projectName),
    'routes',
    fileName
  );
}

export function normalizeRoutePath(path: string) {
  return path.indexOf('/routes/') > -1
    ? path.substring(path.indexOf('/routes/') + 8)
    : path;
}

export function checkRoutePathForErrors(path: string) {
  return (
    path.match(/\w\.\.\w/) || // route.$withParams.tsx => route..tsx
    path.match(/\w\/\/\w/) || // route/$withParams/index.tsx => route//index.tsx
    path.match(/\w\/\.\w/) // route/$withParams.tsx => route/.tsx
  );
}

export function resolveRemixAppDirectory(tree: Tree, projectName: string) {
  const project = readProjectConfiguration(tree, projectName);
  if (!project) throw new Error(`Project does not exist: ${projectName}`);

  const remixConfigPath = joinPathFragments(project.root, 'remix.config.js');

  const remixConfig = eval(tree.read(remixConfigPath, 'utf-8'));

  return joinPathFragments(project.root, remixConfig.appDirectory ?? 'app');
}
