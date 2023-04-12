import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import applicationGenerator from '../application/application.impl';
import routeGenerator from '../route/route.impl';
import loaderGenerator from './loader.impl';

describe('loader', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    tree.write('.gitignore', `/node_modules/dist`);

    await applicationGenerator(tree, { name: 'demo' });
    await routeGenerator(tree, {
      path: 'example',
      project: 'demo',
      style: 'none',
      loader: false,
      action: false,
      meta: false,
      skipChecks: false,
    });
  });

  [
    {
      path: 'apps/demo/app/routes/example.tsx',
    },
    {
      path: 'example',
    },
    {
      path: 'example.tsx',
    },
  ].forEach((config) => {
    describe(`add loader using route path "${config.path}"`, () => {
      beforeEach(async () => {
        await loaderGenerator(tree, {
          path: config.path,
          project: 'demo',
        });
      });

      it('should add imports', async () => {
        const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
        expect(content).toMatch(`import { json } from '@remix-run/node';`);
        expect(content).toMatch(
          `import type { LoaderArgs } from '@remix-run/node';`
        );
        expect(content).toMatch(
          `import { useLoaderData } from '@remix-run/react';`
        );
      });

      it('should add loader function', () => {
        const loaderFunction = `export const loader = async`;
        const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
        expect(content).toMatch(loaderFunction);
      });

      it('should add useLoaderData to component', () => {
        const useLoaderData = `const data = useLoaderData<typeof loader>();`;

        const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
        expect(content).toMatch(useLoaderData);
      });
    });
  });
});
