import { NxJsonConfiguration, readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { gatsbyInitGenerator } from './init';

xdescribe('init', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add react dependencies', async () => {
    await gatsbyInitGenerator(tree, {});
    const packageJson = readJson(tree, 'package.json');
    expect(packageJson.dependencies['@nx/gatsby']).toBeUndefined();
    expect(packageJson.dependencies['@nx/react']).toBeUndefined();
    expect(packageJson.dependencies['gatsby']).toBeDefined();
  });

  describe('defaultCollection', () => {
    it('should be set if none was set before', async () => {
      await gatsbyInitGenerator(tree, {});
      const { cli } = readJson<NxJsonConfiguration>(tree, 'nx.json');
      expect(cli.defaultCollection).toEqual('@nx/gatsby');
    });
  });

  it('should not add jest config if unitTestRunner is none', async () => {
    await gatsbyInitGenerator(tree, { unitTestRunner: 'none' });
    expect(tree.exists('jest.config.js')).toEqual(false);
  });
});
