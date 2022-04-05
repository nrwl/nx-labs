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

import { insertImport } from '@nrwl/workspace/src/generators/utils/insert-import';
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
    ${
      options.style === 'css'
        ? `import stylesUrl from '~/styles/${normalizedRoutePath}.css';
            
            // Provide stylesheet for this page.
          // - https://remix.run/api/conventions#links
          export const links: LinksFunction = () => {
            return [{ rel: 'stylesheet', href: stylesUrl }];
          };`
        : ''
    }

    export default function ${componentName}() {
    ${
      options.loader
        ? `
      const data = useLoaderData();
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
    insertImport(tree, componentPath, 'LinksFunction', 'remix');

    const stylesheetPath = joinPathFragments(
      project.root,
      'app/styles',
      `${normalizedRoutePath}.css`
    );
    tree.write(
      stylesheetPath,
      stripIndents`
      :root {
        --color-foreground: #fff;
        --color-background: #143157;
        --color-links: hsl(214, 73%, 69%);
        --color-border: #275da8;
        --font-body: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          Liberation Mono, Courier New, monospace;
      }
    `
    );
  }

  await formatFiles(tree);
}

function normalizeRoutePath(path: string, projectRoot: string) {
  if (path.indexOf(projectRoot) === -1) return path;
  if (path.indexOf('/routes/') > -1)
    return path.substring(path.indexOf('/routes/') + 8);
  return path.substring(projectRoot.length + 1);
}
