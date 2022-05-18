import resourceRouteGenerator from './resource-route.impl';
import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import applicationGenerator from '../application/application.impl';

describe('resource route', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace();
    tree.write('.gitignore', `/node_modules/dist`);

    await applicationGenerator(tree, { name: 'demo' });
  });

  it('should not create a component', async () => {
    await resourceRouteGenerator(tree, {
      project: 'demo',
      path: '/example/',
      action: false,
      loader: true,
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
      });

      expect(tree.exists('apps/demo/app/routes/example.ts')).toBeTruthy();
    });
  });
});
