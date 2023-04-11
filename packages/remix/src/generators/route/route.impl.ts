import {
  formatFiles,
  joinPathFragments,
  names,
  readProjectConfiguration,
  stripIndents,
  Tree,
} from '@nrwl/devkit';
import {RemixRouteSchema} from './schema';
import LoaderGenerator from '../loader/loader.impl';
import MetaGenerator from '../meta/meta.impl';
import ActionGenerator from '../action/action.impl';
import StyleGenerator from '../style/style.impl';
import {checkRoutePathForErrors, resolveRemixRouteFile} from '../../utils/remix-route-utils';

export default async function (tree: Tree, options: RemixRouteSchema) {
  const project = readProjectConfiguration(tree, options.project);
  if (!project) throw new Error(`Project does not exist: ${options.project}`);

  if (
    !options.skipChecks && checkRoutePathForErrors(options.path)
  ) {
    throw new Error(`Your route path has an indicator of an un-escaped dollar sign for a route param. If this was intended, include the --skipChecks flag.`)
  }

  const routeFilePath = resolveRemixRouteFile(
    tree,
    options.path,
    options.project,
    '.tsx'
  );

  const {className: componentName} = names(
    options.path.replace(/^\//, '').replace(/\/$/, '').replace('.tsx', '')
  );

  if (tree.exists(routeFilePath))
    throw new Error(`Path already exists: ${routeFilePath}`);

  tree.write(
    routeFilePath,
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
    await LoaderGenerator(tree, {
      project: options.project,
      path: routeFilePath,
    });
  }

  if (options.meta) {
    await MetaGenerator(tree, {
      path: routeFilePath,
      project: options.project,
    });
  }

  if (options.action) {
    await ActionGenerator(tree, {
      path: routeFilePath,
      project: options.project,
    });
  }

  if (options.style === 'css') {
    await StyleGenerator(tree, {
      project: options.project,
      path: options.path,
    });
  }

  await formatFiles(tree);
}
