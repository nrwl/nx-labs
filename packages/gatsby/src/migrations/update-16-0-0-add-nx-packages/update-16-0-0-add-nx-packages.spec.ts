import { readJson, Tree, updateJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import replacePackage from './update-16-0-0-add-nx-packages';

describe('update-16-0-0-add-nx-packages', () => {
  let tree: Tree;
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    updateJson(tree, 'package.json', (json) => {
      json.devDependencies['@nrwl/gatsby'] = '16.0.0';
      return json;
    });
  });

  it('should remove the dependency on @nrwl/gatsby', async () => {
    await replacePackage(tree);

    expect(
      readJson(tree, 'package.json').dependencies['@nrwl/gatsby']
    ).not.toBeDefined();
    expect(
      readJson(tree, 'package.json').devDependencies['@nrwl/gatsby']
    ).not.toBeDefined();
  });

  it('should add a dependency on @nx/gatsby', async () => {
    await replacePackage(tree);

    const packageJson = readJson(tree, 'package.json');
    const newDependencyVersion =
      packageJson.devDependencies['@nx/gatsby'] ??
      packageJson.dependencies['@nx/gatsby'];

    expect(newDependencyVersion).toBeDefined();
  });
});
