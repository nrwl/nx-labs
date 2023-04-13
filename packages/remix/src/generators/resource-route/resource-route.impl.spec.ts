import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import applicationGenerator from '../application/application.impl';
import resourceRouteGenerator from './resource-route.impl';

describe('resource route', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    tree.write('.gitignore', `/node_modules/dist`);

    await applicationGenerator(tree, { name: 'demo' });
  });

  it('should not create a component', async () => {
    await resourceRouteGenerator(tree, {
      project: 'demo',
      path: '/example/',
      action: false,
      loader: true,
      skipChecks: false,
    });
    const fileContents = tree.read('apps/demo/app/routes/example.ts', 'utf-8');
    expect(fileContents).not.toMatch('export default function');
  });

  it('should throw an error if loader and action are both false', async () => {
    await expect(
      async () =>
        await resourceRouteGenerator(tree, {
          project: 'demo',
          path: 'example',
          action: false,
          loader: false,
          skipChecks: false,
        })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"The resource route generator requires either \`loader\` or \`action\` to be true"`
    );
  });

  [
    {
      path: 'apps/demo/app/routes/example.ts',
    },
    {
      path: 'example',
    },
    {
      path: 'example.ts',
    },
  ].forEach((config) => {
    it(`should create correct file for path ${config.path}`, async () => {
      await resourceRouteGenerator(tree, {
        project: 'demo',
        path: config.path,
        action: false,
        loader: true,
        skipChecks: false,
      });

      expect(tree.exists('apps/demo/app/routes/example.ts')).toBeTruthy();
    });
  });

  it('should error if it detects a possible missing route param because of un-escaped dollar sign', async () => {
    expect.assertions(3);

    await resourceRouteGenerator(tree, {
      project: 'demo',
      path: 'route1/.ts', // route.$withParams.tsx => route..tsx
      loader: true,
      action: true,
      skipChecks: false,
    }).catch((e) =>
      expect(e).toMatchInlineSnapshot(
        `[Error: Your route path has an indicator of an un-escaped dollar sign for a route param. If this was intended, include the --skipChecks flag.]`
      )
    );

    await resourceRouteGenerator(tree, {
      project: 'demo',
      path: 'route2//index.ts', // route/$withParams/index.tsx => route//index.tsx
      loader: true,
      action: true,
      skipChecks: false,
    }).catch((e) =>
      expect(e).toMatchInlineSnapshot(
        `[Error: Your route path has an indicator of an un-escaped dollar sign for a route param. If this was intended, include the --skipChecks flag.]`
      )
    );

    await resourceRouteGenerator(tree, {
      project: 'demo',
      path: 'route3/.ts', // route/$withParams.tsx => route/.tsx
      loader: true,
      action: true,
      skipChecks: false,
    }).catch((e) =>
      expect(e).toMatchInlineSnapshot(
        `[Error: Your route path has an indicator of an un-escaped dollar sign for a route param. If this was intended, include the --skipChecks flag.]`
      )
    );
  });

  it('should succeed if skipChecks flag is passed, and it detects a possible missing route param because of un-escaped dollar sign', async () => {
    await resourceRouteGenerator(tree, {
      project: 'demo',
      path: 'route1/..ts', // route.$withParams.tsx => route..tsx
      loader: true,
      action: true,
      skipChecks: true,
    });

    expect(tree.exists('apps/demo/app/routes/route1/..ts')).toBe(true);

    await resourceRouteGenerator(tree, {
      project: 'demo',
      path: 'route2//index.ts', // route/$withParams/index.tsx => route//index.tsx
      loader: true,
      action: true,
      skipChecks: true,
    });

    expect(tree.exists('apps/demo/app/routes/route2/index.ts')).toBe(true);

    await resourceRouteGenerator(tree, {
      project: 'demo',
      path: 'route3/.ts', // route/$withParams.tsx => route/.tsx
      loader: true,
      action: true,
      skipChecks: true,
    });

    expect(tree.exists('apps/demo/app/routes/route3/.ts')).toBe(true);
  });
});
