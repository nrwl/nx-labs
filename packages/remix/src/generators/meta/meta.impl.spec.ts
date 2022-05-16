import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import metaGenerator from './meta.impl';
import applicationGenerator from '../application/application.impl';
import routeGenerator from '../route/route.impl';

describe('meta', () => {
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
        await metaGenerator(tree, {
          path: config.path,
          project: 'demo',
        });
      });

      it('should add imports', async () => {
        const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
        expect(content).toMatch(
          `import type { MetaFunction } from '@remix-run/node';`
        );
      });

      it('should add meta function', () => {
        const metaFunction = `export const meta: MetaFunction`;
        const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
        expect(content).toMatch(metaFunction);
      });
    });
  });
});
