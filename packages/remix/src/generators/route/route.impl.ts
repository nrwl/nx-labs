import {
  formatFiles,
  getProjects,
  joinPathFragments,
  names,
  stripIndents,
  Tree,
} from '@nrwl/devkit';
import { RemixRouteSchema } from './schema';

export default async function (tree: Tree, options: RemixRouteSchema) {
  const { fileName: routePath, className: componentName } = names(
    options.path.replace(/^\//, '').replace(/\/$/, '')
  );
  const projects = getProjects(tree);
  const project = projects.get(options.project);

  if (!project) throw new Error(`Project does not exist: ${options.project}`);

  const componentPath = joinPathFragments(
    project.root,
    'app/routes',
    `${routePath}.tsx`
  );

  if (tree.exists(componentPath))
    throw new Error(`Path already exists: ${options.path}`);

  tree.write(
    componentPath,
    stripIndents`
    import { useEffect, useRef } from 'react';
    ${
      options.style === 'css'
        ? `import type { LinksFunction, LoaderFunction, MetaFunction } from 'remix';
      `
        : `import type { LoaderFunction, MetaFunction } from 'remix';`
    }
    import { useActionData, useLoaderData, redirect } from 'remix';

    ${
      options.style === 'css'
        ? `import stylesUrl from '~/styles/${routePath}.css';`
        : ''
    }


    // Provide meta tags for this page.
    // - https://remix.run/api/conventions#meta
    export const meta: MetaFunction = () =>{
      return { title: '${componentName}' };
    }

    ${
      options.style === 'css'
        ? stripIndents`
          // Provide stylesheet for this page.
          // - https://remix.run/api/conventions#links
          export const links: LinksFunction = () => {
            return [{ rel: 'stylesheet', href: stylesUrl }];
          };
        `
        : ''
    }

    // Use this function to provide data for the route.
    // - https://remix.run/api/conventions#loader
    export const loader: LoaderFunction = async () => {
      return {
        message: 'Hello, world!',
      }
    }

    export default function ${componentName}() {
      const data = useLoaderData();
      return (
        <p>
          Message: {data.message}
        </p>
      );
    }
  `
  );

  if (options.style === 'css') {
    const stylesheetPath = joinPathFragments(
      project.root,
      'app/styles',
      `${routePath}.css`
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
