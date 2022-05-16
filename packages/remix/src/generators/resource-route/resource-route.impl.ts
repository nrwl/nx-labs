import {
  formatFiles,
  joinPathFragments,
  names,
  readProjectConfiguration,
  stripIndents,
  Tree,
} from '@nrwl/devkit';
import { RemixRouteSchema } from './schema';
import LoaderGenerator from '../loader/loader.impl';
import ActionGenerator from '../action/action.impl';

import { insertImport } from '../../utils/insert-import';

export default async function (tree: Tree, options: RemixRouteSchema) {
  const { fileName: routePath, className: componentName } = names(
    options.path.replace(/^\//, '').replace(/\/$/, '')
  );

  const project = readProjectConfiguration(tree, options.project);
  if (!project) throw new Error(`Project does not exist: ${options.project}`);

  const normalizedRoutePath = normalizeRoutePath(routePath, project.root);

  const routeFilePath = joinPathFragments(
    project.root,
    'app/routes',
    `${normalizedRoutePath}.ts`
  );

  if (tree.exists(routeFilePath))
    throw new Error(`Path already exists: ${options.path}`);

  tree.write(routeFilePath, '');

  if (options.loader) {
    await LoaderGenerator(tree, { file: routeFilePath });
  }

  if (options.action) {
    await ActionGenerator(tree, { file: routeFilePath });
  }

  await formatFiles(tree);
}

function normalizeRoutePath(path: string, projectRoot: string) {
  if (path.indexOf(projectRoot) === -1) return path;
  if (path.indexOf('/routes/') > -1)
    return path.substring(path.indexOf('/routes/') + 8);
  return path.substring(projectRoot.length + 1);
}
