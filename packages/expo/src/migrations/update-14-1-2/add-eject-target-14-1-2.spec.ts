import { addProjectConfiguration, getProjects, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import update from './add-eject-target-14-1-2';

describe('add-eject-target-14-1-2', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, 'product', {
      root: 'apps/product',
      sourceRoot: 'apps/product/src',
      targets: {
        start: {
          executor: '@nrwl/expo:start',
        },
      },
    });
  });

  it(`should update project.json with target eject`, async () => {
    await update(tree);

    getProjects(tree).forEach((project) => {
      expect(project.targets['eject']).toEqual({
        executor: '@nrwl/expo:eject',
        options: {},
      });
    });
  });
});
