import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import applicationGenerator from '../application/application.impl';
import presetGenerator from '../preset/preset.impl';
import routeGenerator from './route.impl';

describe('route', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    tree.write('.gitignore', `/node_modules/dist`);
  });

  it('should add route component', async () => {
    await applicationGenerator(tree, { name: 'demo' });
    await routeGenerator(tree, {
      project: 'demo',
      path: 'path/to/example',
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    });

    const content = tree.read(
      'apps/demo/app/routes/path/to/example.tsx',
      'utf-8'
    );
    expect(content).toMatchSnapshot();
    expect(content).toMatch('LinksFunction');
    expect(content).toMatch('function PathToExample(');
    expect(
      tree.exists('apps/demo/app/styles/path/to/example.css')
    ).toBeTruthy();
  }, 25_000);

  it('should support --style=none', async () => {
    await applicationGenerator(tree, { name: 'demo' });
    await routeGenerator(tree, {
      project: 'demo',
      path: 'example',
      style: 'none',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    });

    const content = tree.read('apps/demo/app/routes/example.tsx').toString();
    expect(content).not.toMatch('LinksFunction');
    expect(tree.exists('apps/demo/app/styles/example.css')).toBeFalsy();
  });

  it('should handle trailing and prefix slashes', async () => {
    await applicationGenerator(tree, { name: 'demo' });
    await routeGenerator(tree, {
      project: 'demo',
      path: '/example/',
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    });

    const content = tree.read('apps/demo/app/routes/example.tsx').toString();
    expect(content).toMatch('function Example(');
  });

  it('should handle routes that end in a file', async () => {
    await applicationGenerator(tree, { name: 'demo' });
    await routeGenerator(tree, {
      project: 'demo',
      path: '/example/index.tsx',
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    });

    const content = tree
      .read('apps/demo/app/routes/example/index.tsx')
      .toString();
    expect(content).toMatch('function ExampleIndex(');
  });

  it('should handle routes that have a param', async () => {
    await applicationGenerator(tree, { name: 'demo' });
    await routeGenerator(tree, {
      project: 'demo',
      path: '/example/$withParam.tsx',
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    });

    const content = tree
      .read('apps/demo/app/routes/example/$withParam.tsx')
      .toString();
    expect(content).toMatch('function ExampleWithParam(');
  });

  it('should error if it detects a possible missing route param because of un-escaped dollar sign', async () => {
    await applicationGenerator(tree, { name: 'demo' });

    expect.assertions(3);

    await routeGenerator(tree, {
      project: 'demo',
      path: 'route1/.tsx', // route.$withParams.tsx => route..tsx
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    }).catch((e) =>
      expect(e).toMatchInlineSnapshot(
        `[Error: Your route path has an indicator of an un-escaped dollar sign for a route param. If this was intended, include the --skipChecks flag.]`
      )
    );

    await routeGenerator(tree, {
      project: 'demo',
      path: 'route2//index.tsx', // route/$withParams/index.tsx => route//index.tsx
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    }).catch((e) =>
      expect(e).toMatchInlineSnapshot(
        `[Error: Your route path has an indicator of an un-escaped dollar sign for a route param. If this was intended, include the --skipChecks flag.]`
      )
    );

    await routeGenerator(tree, {
      project: 'demo',
      path: 'route3/.tsx', // route/$withParams.tsx => route/.tsx
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    }).catch((e) =>
      expect(e).toMatchInlineSnapshot(
        `[Error: Your route path has an indicator of an un-escaped dollar sign for a route param. If this was intended, include the --skipChecks flag.]`
      )
    );
  });

  it('should succeed if skipChecks flag is passed, and it detects a possible missing route param because of un-escaped dollar sign', async () => {
    await applicationGenerator(tree, { name: 'demo' });

    await routeGenerator(tree, {
      project: 'demo',
      path: 'route1/..tsx', // route.$withParams.tsx => route..tsx
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: true,
    });

    expect(tree.exists('apps/demo/app/routes/route1/..tsx')).toBe(true);

    await routeGenerator(tree, {
      project: 'demo',
      path: 'route2//index.tsx', // route/$withParams/index.tsx => route//index.tsx
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: true,
    });

    expect(tree.exists('apps/demo/app/routes/route2/index.tsx')).toBe(true);

    await routeGenerator(tree, {
      project: 'demo',
      path: 'route3/.tsx', // route/$withParams.tsx => route/.tsx
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: true,
    });

    expect(tree.exists('apps/demo/app/routes/route3/.tsx')).toBe(true);
  }, 120000);

  it('should place routes correctly when app dir is changed', async () => {
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
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    });

    expect(tree.exists('apps/demo/my-custom-dir/routes/route.tsx')).toBe(true);
    expect(tree.exists('apps/demo/my-custom-dir/styles/route.css')).toBe(true);
  });

  it('should normalize route paths', async () => {
    await applicationGenerator(tree, { name: 'demo' });

    await routeGenerator(tree, {
      project: 'demo',
      path: 'routeRelativeToRoutesDir.tsx',
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    });

    expect(
      tree.exists('apps/demo/app/routes/routeRelativeToRoutesDir.tsx')
    ).toBe(true);

    await routeGenerator(tree, {
      project: 'demo',
      path: 'app/routes/routeRelativeToProjectRoot.tsx',
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    });

    expect(
      tree.exists('apps/demo/app/routes/routeRelativeToProjectRoot.tsx')
    ).toBe(true);

    await routeGenerator(tree, {
      project: 'demo',
      path: 'apps/demo/app/routes/routeRelativeToWorkspaceRoot.tsx',
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    });

    expect(
      tree.exists('apps/demo/app/routes/routeRelativeToWorkspaceRoot.tsx')
    ).toBe(true);

    await routeGenerator(tree, {
      project: 'demo',
      path: 'apps/demo/app/routes/route/using/v1/routing.tsx',
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    });

    expect(tree.exists('apps/demo/app/routes/route/using/v1/routing.tsx')).toBe(
      true
    );

    await routeGenerator(tree, {
      project: 'demo',
      path: 'apps/demo/app/routes/route.using.v2.routing.tsx',
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    });

    expect(tree.exists('apps/demo/app/routes/route.using.v2.routing.tsx')).toBe(
      true
    );
  }, 30000);

  it('should place the route correctly in a standalone app', async () => {
    await presetGenerator(tree, { name: 'demo' });

    await routeGenerator(tree, {
      project: 'demo',
      path: 'route.tsx',
      style: 'none',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    });

    expect(tree.exists('app/routes/route.tsx')).toBe(true);
  });
});
