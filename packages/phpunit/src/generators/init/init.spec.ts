import { ProjectGraph, readNxJson, Tree, updateNxJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { initGenerator } from './init';

let projectGraph: ProjectGraph;
jest.mock('@nx/devkit', () => ({
  ...jest.requireActual<any>('@nx/devkit'),
  createProjectGraphAsync: jest.fn().mockImplementation(async () => {
    return projectGraph;
  }),
}));

describe('@nx/phpunit:init', () => {
  let tree: Tree;

  beforeEach(() => {
    projectGraph = {
      nodes: {},
      dependencies: {},
    };
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add the plugin', async () => {
    await initGenerator(tree, {
      skipFormat: true,
      skipPackageJson: false,
    });
    const nxJson = readNxJson(tree);
    expect(nxJson.plugins).toMatchInlineSnapshot(`
      Array [
        Object {
          "options": Object {
            "installTargetName": "install",
            "updateTargetName": "update",
          },
          "plugin": "@nx/composer",
        },
        Object {
          "options": Object {
            "targetName": "test",
          },
          "plugin": "@nx/phpunit",
        },
      ]
    `);
  });

  it('should not overwrite existing plugins', async () => {
    updateNxJson(tree, {
      plugins: ['foo'],
    });
    await initGenerator(tree, {
      skipFormat: true,
      skipPackageJson: false,
    });
    const nxJson = readNxJson(tree);
    expect(nxJson.plugins).toMatchInlineSnapshot(`
      Array [
        "foo",
        Object {
          "options": Object {
            "installTargetName": "install",
            "updateTargetName": "update",
          },
          "plugin": "@nx/composer",
        },
        Object {
          "options": Object {
            "targetName": "test",
          },
          "plugin": "@nx/phpunit",
        },
      ]
    `);
  });
});
