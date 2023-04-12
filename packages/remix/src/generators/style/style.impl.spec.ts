import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import applicationGenerator from '../application/application.impl';
import presetGenerator from '../preset/preset.impl';
import routeGenerator from '../route/route.impl';
import styleGenerator from './style.impl';

describe('route', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    tree.write('.gitignore', `/node_modules/dist`);
  });

  it('should add css file to shared styles directory', async () => {
    await applicationGenerator(tree, { name: 'demo' });
    await routeGenerator(tree, {
      project: 'demo',
      path: 'path/to/example',
      style: 'none',
      loader: false,
      action: false,
      meta: false,
      skipChecks: false,
    });
    await styleGenerator(tree, {
      project: 'demo',
      path: 'path/to/example',
    });

    expect(
      tree.exists('apps/demo/app/styles/path/to/example.css')
    ).toBeTruthy();
  });

  it('should handle routes that have a param', async () => {
    await applicationGenerator(tree, { name: 'demo' });
    await routeGenerator(tree, {
      project: 'demo',
      path: '/example/$withParam.tsx',
      style: 'none',
      loader: false,
      action: false,
      meta: false,
      skipChecks: false,
    });
    await styleGenerator(tree, {
      project: 'demo',
      path: '/example/$withParam.tsx',
    });

    expect(
      tree.exists('apps/demo/app/styles/example/$withParam.css')
    ).toBeTruthy();
  });

  it('should place styles correctly when app dir is changed', async () => {
    await applicationGenerator(tree, { name: 'demo' });

    tree.write(
      'apps/demo/remix.config.js',
      `
    /**
     * @type {import('@remix-run/dev').AppConfig}
     */
    module.exports = {
      ignoredRouteFiles: ["**/.*"],
      appDirectory: "my-custom-dir",
    };`
    );

    await routeGenerator(tree, {
      project: 'demo',
      path: 'route.tsx',
      style: 'none',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    });
    await styleGenerator(tree, {
      project: 'demo',
      path: '/route.tsx',
    });

    expect(tree.exists('apps/demo/my-custom-dir/styles/route.css')).toBe(true);
  });

  it('should import stylesheet with a relative path in an integrated workspace', async () => {
    await applicationGenerator(tree, { name: 'demo' });
    await routeGenerator(tree, {
      project: 'demo',
      path: '/example/$withParam.tsx',
      style: 'none',
      loader: false,
      action: false,
      meta: false,
      skipChecks: false,
    });
    await styleGenerator(tree, {
      project: 'demo',
      path: '/example/$withParam.tsx',
    });
    const content = tree.read(
      'apps/demo/app/routes/example/$withParam.tsx',
      'utf-8'
    );

    expect(content).toMatch(
      "import stylesUrl from '../../styles/example/$withParam.css';"
    );
  });

  it('should import stylesheet using ~ in a standalone project', async () => {
    await presetGenerator(tree, { name: 'demo' });

    await routeGenerator(tree, {
      project: 'demo',
      path: '/example/$withParam.tsx',
      style: 'none',
      loader: false,
      action: false,
      meta: false,
      skipChecks: false,
    });

    await styleGenerator(tree, {
      project: 'demo',
      path: '/example/$withParam.tsx',
    });
    const content = tree.read('app/routes/example/$withParam.tsx', 'utf-8');

    expect(content).toMatch(
      "import stylesUrl from '~/styles/example/$withParam.css';"
    );
  });
});
