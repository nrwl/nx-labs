import { readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/node';
import { setupServerlessGenerator } from './setup-serverless';
describe('setupServerlessGenerator', () => {
  let tree: Tree;

  beforeEach(() => (tree = createTreeWithEmptyWorkspace()));

  describe('integrated', () => {
    it('should create a netlify platform specific asset which is used to deploy', async () => {
      await applicationGenerator(tree, {
        name: 'api',
        framework: 'express',
        e2eTestRunner: 'none',
        docker: false,
      });
      await setupServerlessGenerator(tree, {
        project: 'api',
      });

      const project = readProjectConfiguration(tree, 'api');
      expect(tree.exists('netlify.toml'));
      expect(project.targets).toEqual(
        expect.objectContaining({
          serve: {
            command: 'npx netlify dev',
          },
          deploy: {
            dependsOn: ['build','lint'],
            command: 'npx netlify deploy --prod-if-unlocked',
          },
        })
      );
    });
  });

  describe('standalone', () => {
    it('should create a netlify platform specific asset which is used to deploy', async () => {
      await applicationGenerator(tree, {
        name: 'api',
        framework: 'express',
        rootProject: true,
        docker: false,
      });

      await setupServerlessGenerator(tree, {
        project: 'api',
      });

      const project = readProjectConfiguration(tree, 'api');
      expect(tree.exists('netlify.toml'));
      expect(project.targets).toEqual(
        expect.objectContaining({
          serve: {
            command: 'npx netlify dev',
          },
          deploy: {
            dependsOn: ['build','lint'],
            command: 'npx netlify deploy --prod-if-unlocked',
          },
        })
      );
    });
  });
});
