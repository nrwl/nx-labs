import { readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from 'nx/src/devkit-testing-exports';
import { serverlessGenerator } from './serverless';
describe('serverless', () => {
  let tree: Tree;

  beforeEach(() => (tree = createTreeWithEmptyWorkspace()));

  it('should be an empty node project', async () => {
    await serverlessGenerator(tree, {
      name: 'api',
    });

    const project = readProjectConfiguration(tree, 'api');
    expect(tree.exists('netlify.toml'));
    expect(tree.exists('src/main.ts'));
    expect(tree.exists('functions/hello/hello.ts'));
    expect(project.targets).toEqual(
      expect.objectContaining({
        dev: {
          command: 'npx netlify dev'
        },
        deploy: {
          dependsOn: ['lint'],
          command: 'npx netlify deploy --prod-if-unlocked',
        },
      })
    );
  });
});
