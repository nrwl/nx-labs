import { readJson, Tree, updateJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import replacePackage from './update-16-0-0-add-nx-packages';

describe('update-16-0-0-add-nx-packages', () => {
  let tree: Tree;
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    updateJson(tree, 'package.json', (json) => {
      json.devDependencies['@nrwl/aws-lambda'] = '16.0.0';
      return json;
    });
  });

  it('should remove the dependency on @nrwl/aws-lambda', async () => {
    await replacePackage(tree);

    expect(
      readJson(tree, 'package.json').dependencies['@nrwl/aws-lambda']
    ).not.toBeDefined();
    expect(
      readJson(tree, 'package.json').devDependencies['@nrwl/aws-lambda']
    ).not.toBeDefined();
  });

  it('should add a dependency on @nx/aws-lambda', async () => {
    await replacePackage(tree);

    const packageJson = readJson(tree, 'package.json');
    const newDependencyVersion =
      packageJson.devDependencies['@nx/aws-lambda'] ??
      packageJson.dependencies['@nx/aws-lambda'];

    expect(newDependencyVersion).toBeDefined();
  });
});
