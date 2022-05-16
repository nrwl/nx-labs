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
import MetaGenerator from '../meta/meta.impl';
import ActionGenerator from '../action/action.impl';
import StyleGenerator from '../style/style.impl';

import { insertImport } from '../../utils/insert-import';

export default async function (tree: Tree, options: RemixRouteSchema) {
  const { fileName: routePath, className: componentName } = names(
    options.path.replace(/^\//, '').replace(/\/$/, '')
  );

  const project = readProjectConfiguration(tree, options.project);
  if (!project) throw new Error(`Project does not exist: ${options.project}`);

  const normalizedRoutePath = normalizeRoutePath(routePath, project.root);

  const componentPath = joinPathFragments(
    project.root,
    'app/routes',
    `${normalizedRoutePath}.tsx`
  );

  if (tree.exists(componentPath))
    throw new Error(`Path already exists: ${options.path}`);

  tree.write(
    componentPath,
    stripIndents`


    export default function ${componentName}() {
    ${
      options.loader
        ? `
      return (
        <p>
          Message: {data.message}
        </p>
      );
    `
        : `return (<p>${componentName} works!</p>)`
    }
    }
  `
  );

  if (options.loader) {
    await LoaderGenerator(tree, { file: componentPath });
  }

  if (options.meta) {
    await MetaGenerator(tree, { file: componentPath });
  }

  if (options.action) {
    await ActionGenerator(tree, { file: componentPath });
  }

  if (options.style === 'css') {
    await StyleGenerator(tree, {
      project: options.project,
      path: options.path,
    });
  }

  await formatFiles(tree);
}

function normalizeRoutePath(path: string, projectRoot: string) {
  if (path.indexOf(projectRoot) === -1) return path;
  if (path.indexOf('/routes/') > -1)
    return path.substring(path.indexOf('/routes/') + 8);
  return path.substring(projectRoot.length + 1);
}
