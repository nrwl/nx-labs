import {Tree} from '@nrwl/devkit';
import {createTreeWithEmptyWorkspace} from '@nrwl/devkit/testing';
import applicationGenerator from '../application/application.impl';
import routeGenerator from './route.impl';

describe('route', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({layout: 'apps-libs'});
    tree.write('.gitignore', `/node_modules/dist`);
  });

  it('should add route component', async () => {
    await applicationGenerator(tree, {name: 'demo'});
    await routeGenerator(tree, {
      project: 'demo',
      path: 'path/to/example',
      style: 'css',
      loader: true,
      action: true,
      meta: true,
      skipChecks: false,
    });

    const content = tree
      .read('apps/demo/app/routes/path/to/example.tsx')
      .toString();
    expect(content).toMatch('LinksFunction');
    expect(content).toMatch('function PathToExample(');
    expect(
      tree.exists('apps/demo/app/styles/path/to/example.css')
    ).toBeTruthy();
  });

  it('should support --style=none', async () => {
    await applicationGenerator(tree, {name: 'demo'});
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
    await applicationGenerator(tree, {name: 'demo'});
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
    await applicationGenerator(tree, {name: 'demo'});
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
    await applicationGenerator(tree, {name: 'demo'});
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
    await applicationGenerator(tree, {name: 'demo'});

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
    await applicationGenerator(tree, {name: 'demo'});

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

  });
});
