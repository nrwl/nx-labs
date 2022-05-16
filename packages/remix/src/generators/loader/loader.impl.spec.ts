import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import loaderGenerator from './loader.impl';
import applicationGenerator from '../application/application.impl';
import routeGenerator from '../route/route.impl';

describe('loader', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace();
    tree.write('.gitignore', `/node_modules/dist`);

    await applicationGenerator(tree, { name: 'demo' });
    await routeGenerator(tree, {
      path: 'example',
      project: 'demo',
      style: 'none',
      loader: false,
      action: false,
      meta: false,
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
        expect(content).toMatch(
          `import type { LoaderFunction } from '@remix-run/node';`
        );
      });

      it('should add loader function', () => {
        const loaderFunctionType = `type ExampleLoaderData`;
        const loaderFunction = ` export const loader: LoaderFunction = async`;
        const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
        expect(content).toMatch(loaderFunctionType);
        expect(content).toMatch(loaderFunction);
      });

      it('should add useLoaderData to component', () => {
        const useLoaderData = `const data = useLoaderData<ExampleLoaderData>();`;

        const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
        expect(content).toMatch(useLoaderData);
      });
    });
  });
});
