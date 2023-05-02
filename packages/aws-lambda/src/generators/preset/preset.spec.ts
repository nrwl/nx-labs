import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from 'nx/src/devkit-testing-exports';
import awsLambdaPreset from './preset';

describe('aws-lambda preset', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should create a default aws-lambda workspace', async () => {
    await awsLambdaPreset(tree, {
      name: 'aws-demo',
    });

    expect(tree.exists('samconfig.toml'));
    expect(tree.exists('template.yaml'));
  });
});
