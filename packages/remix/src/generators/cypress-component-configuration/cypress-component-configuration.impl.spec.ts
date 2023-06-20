import { joinPathFragments, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import libraryGenerator from '../library/library.impl';
import cypressComponentConfigurationGenerator from './cypress-component-configuration.impl';

describe('CypressComponentConfiguration', () => {
  it('should create the cypress configuration correctly', async () => {
    // ARRANGE
    const tree = createTreeWithEmptyWorkspace();

    await libraryGenerator(tree, {
      name: 'cypress-test',
      unitTestRunner: 'vitest',
      style: 'css',
    });

    // ACT
    await cypressComponentConfigurationGenerator(tree, {
      project: 'cypress-test',
      generateTests: true,
    });

    // ASSERT
    const project = readProjectConfiguration(tree, 'cypress-test');
    expect(
      tree.read(joinPathFragments(project.root, 'cypress.config.ts'), 'utf-8')
    ).toMatchInlineSnapshot(`
      "import { nxComponentTestingPreset } from '@nx/remix/plugins/component-testing';
      import { defineConfig } from 'cypress';

      export default defineConfig({
        component: nxComponentTestingPreset(__filename),
      });
      "
    `);
    expect(project.targets['component-test']).toMatchInlineSnapshot(`
      Object {
        "executor": "@nx/cypress:cypress",
        "options": Object {
          "cypressConfig": "cypress-test/cypress.config.ts",
          "devServerTarget": "",
          "skipServe": true,
          "testingType": "component",
        },
      }
    `);
    expect(
      tree.exists(joinPathFragments(project.root, 'cypress'))
    ).toBeTruthy();
  });
});
