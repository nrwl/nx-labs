import {
  formatFiles,
  joinPathFragments,
  names,
  readProjectConfiguration,
  stripIndents,
  Tree,
} from '@nrwl/devkit';
import { RemixStyleSchema } from './schema';

import { insertImport } from '../../utils/insert-import';
import { insertStatementAfterImports } from '../../utils/insert-statement-after-imports';
import {
  normalizeRoutePath,
  resolveRemixRouteFile,
} from '../../utils/remix-route-utils';

export default async function (tree: Tree, options: RemixStyleSchema) {
  const { fileName: routePath, className: componentName } = names(
    options.path.replace(/^\//, '').replace(/\/$/, '').replace('.tsx', '')
  );

  const project = readProjectConfiguration(tree, options.project);
  if (!project) throw new Error(`Project does not exist: ${options.project}`);

  const normalizedRoutePath = normalizeRoutePath(routePath, project.root);

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

  const routeFilePath = resolveRemixRouteFile(
    tree,
    options.path,
    options.project,
    '.tsx'
  );

  insertImport(tree, routeFilePath, 'LinksFunction', '@remix-run/node', {
    typeOnly: true,
  });

  insertStatementAfterImports(
    tree,
    routeFilePath,
    `
    import stylesUrl from '~/styles/${normalizedRoutePath}.css'
    
    export const links: LinksFunction = () => {
      return [{ rel: 'stylesheet', href: stylesUrl }];
    };
  `
  );

  await formatFiles(tree);
}
