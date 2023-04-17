import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import applicationGenerator from '../../application/application.impl';
import routeGenerator from '../../route/route.impl';
import { v2MetaGenerator } from './v2.impl';

describe('meta v2', () => {
  let tree: Tree;

  test.each([['apps/demo/app/routes/example.tsx', 'example', 'example.tsx']])(
    'add meta using route path "%s"',
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

      await v2MetaGenerator(tree, {
        path,
        project: 'demo',
      });

      const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
      expect(content).toMatch(
        `import type { V2_MetaFunction } from '@remix-run/node';`
      );

      expect(content).toMatch(`export const meta: V2_MetaFunction`);
      expect(content).toMatch(`return [`);
    }
  );
});
