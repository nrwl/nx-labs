import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import applicationGenerator from '../../application/application.impl';
import routeGenerator from '../../route/route.impl';
import { v1MetaGenerator } from './v1.impl';

describe('meta v1', () => {
  let tree: Tree;

  test.each([['apps/demo/app/routes/example.tsx', 'example', 'example.tsx']])(
    'add meta using route path "%i"',
    async (path) => {
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

      await v1MetaGenerator(tree, {
        path,
        project: 'demo',
      });

      const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
      expect(content).toMatch(
        `import type { MetaFunction } from '@remix-run/node';`
      );

      expect(content).toMatch(`export const meta: MetaFunction`);
      expect(content).toMatch(`return {`);
    }
  );
});
