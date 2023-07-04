import { readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import generator from './cypress.impl';

describe('Cypress generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate cypress project', async () => {
    await generator(tree, { project: 'demo', name: 'demo-e2e' });

    const config = readProjectConfiguration(tree, 'demo-e2e');
    expect(config.targets).toEqual({
      e2e: {
        dependsOn: ['dev-server'],
        executor: '@nx/cypress:cypress',
        options: {
          baseUrl: 'http://localhost:3000',
          cypressConfig: 'demo-e2e/cypress.config.ts',
          skipServe: true,
          testingType: 'e2e',
        },
      },
      lint: {
        executor: '@nx/linter:eslint',
        options: {
          lintFilePatterns: ['demo-e2e/**/*.{js,ts}'],
        },
        outputs: ['{options.outputFile}'],
      },
      'dev-server': {
        command: 'nx serve demo',
        configurations: {
          production: {
            command: 'nx serve demo --configuration=production',
          },
        },
        options: {
          readyWhen: 'Server started',
        },
      },
    });
  });
});
