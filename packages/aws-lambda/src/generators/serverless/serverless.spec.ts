import { readProjectConfiguration, Tree } from '@nx/devkit';
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
    expect(tree.exists('samconfig.toml'));
    expect(tree.exists('template.yaml'));
    expect(tree.exists('functions/hello-world/app.ts'));
    expect(project.targets).toMatchObject({
      'serve-functions': {
        command: 'sam build && sam local start-api',
      },
      'deploy-functions': {
        command: 'sam build && sam deploy --guided',
      },
    });

    expect(tree.exists('src')).toBeFalsy();
    expect(tree.exists('tools')).toBeFalsy();
  });
});
