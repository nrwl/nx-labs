import { readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { applicationGenerator } from '@nrwl/node';
import { setupServerlessGenerator } from './setup-serverless';

describe('AWS Lambda Setup Serverless Generator', () => {
  let tree: Tree;

  beforeEach(() => (tree = createTreeWithEmptyWorkspace()));

  it('should create add aws lambda configurations', async () => {
    const projectName = 'awslambda';
    await applicationGenerator(tree, {
      name: projectName,
      framework: 'none',
      e2eTestRunner: 'none',
      rootProject: true,
      docker: false,
    });

    await setupServerlessGenerator(tree, {
      name: projectName,
    });

    const projectConfig = readProjectConfiguration(tree, projectName);
    expect(tree.exists('samconfig.toml'));
    expect(tree.exists('template.yaml'));
    expect(projectConfig.targets).toEqual(
      expect.objectContaining({
        serve: {
          command: 'sam build && sam local start-api',
        },
        deploy: {
          command: 'sam build && sam deploy --guided',
        },
      })
    );
  });
});
