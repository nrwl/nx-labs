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

describe('@nx/php:init', () => {
  let tree: Tree;

  beforeEach(() => {
    projectGraph = {
      nodes: {},
      dependencies: {},
    };
    tree = createTreeWithEmptyWorkspace();
  });

  describe('composer setup', () => {
    it('should add the plugin', async () => {
      await initGenerator(tree, {
        skipFormat: true,
        skipPackageJson: false,
      });
      const nxJson = readNxJson(tree);
      expect(nxJson).toMatchInlineSnapshot(`
        Object {
          "affected": Object {
            "defaultBase": "main",
          },
          "namedInputs": Object {
            "default": Array [
              "{projectRoot}/**/*",
            ],
            "production": Array [
              "default",
              "!{projectRoot}/**/*.md",
              "!{projectRoot}/(test|tests|Test|Tests)/**/*",
            ],
          },
          "plugins": Array [
            Object {
              "options": Object {
                "ignorePattern": "**/{tests,fixtures}/**",
                "installTargetName": "install",
                "updateTargetName": "update",
              },
              "plugin": "@nx/php/composer",
            },
          ],
          "targetDefaults": Object {
            "build": Object {
              "cache": true,
            },
            "lint": Object {
              "cache": true,
            },
          },
        }
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
              "ignorePattern": "**/{tests,fixtures}/**",
              "installTargetName": "install",
              "updateTargetName": "update",
            },
            "plugin": "@nx/php/composer",
          },
        ]
      `);
    });
  });

  describe('phpunit setup', () => {
    it.each`
      configFile
      ${'phpunit.xml'}
      ${'phpunit.xml.dist'}
      ${'src/Example/Example/phpunit.xml'}
      ${'src/Example/Example/phpunit.xml.dist'}
    `('should add the plugin', async ({ configFile }) => {
      tree.write(configFile, '<phpunit></phpunit>');

      await initGenerator(tree, {
        skipFormat: true,
        skipPackageJson: false,
      });

      const nxJson = readNxJson(tree);
      expect(nxJson.plugins).toMatchInlineSnapshot(`
        Array [
          Object {
            "options": Object {
              "ignorePattern": "**/{tests,fixtures}/**",
              "installTargetName": "install",
              "updateTargetName": "update",
            },
            "plugin": "@nx/php/composer",
          },
          Object {
            "options": Object {
              "targetName": "test",
            },
            "plugin": "@nx/php/phpunit",
          },
        ]
      `);
    });
  });
});
