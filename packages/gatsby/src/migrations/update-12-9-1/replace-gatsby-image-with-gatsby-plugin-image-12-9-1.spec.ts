import { addProjectConfiguration, readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { jestConfigObject } from '@nx/jest/src/utils/config/functions';

import { gatsbyPluginImageVersion } from '../../utils/versions';

import update from './replace-gatsby-image-with-gatsby-plugin-image-12-9-1';

describe('Replace gatsby-image with gatsby-plugin-image to dependencies 12.9.1', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it(`should replace with gatsby-plugin-image if gatsby-image is in dependencies`, async () => {
    tree.write(
      'package.json',
      JSON.stringify({
        dependencies: { 'gatsby-image': '*' },
        devDependencies: {},
      })
    );

    await update(tree);

    const dependencies = readJson(tree, 'package.json').dependencies;
    expect(dependencies['gatsby-image']).toBeUndefined();
    expect(dependencies['gatsby-plugin-image']).toEqual(
      gatsbyPluginImageVersion
    );
  });

  it(`should not replace gatsby-plugin-image version if gatsby-image is not in dependencies`, async () => {
    tree.write(
      'package.json',
      JSON.stringify({
        dependencies: { gatsby: '*', 'gatsby-plugin-image': '*' },
        devDependencies: {},
      })
    );

    await update(tree);

    const dependencies = readJson(tree, 'package.json').dependencies;
    expect(dependencies['gatsby-plugin-image']).toEqual('*');
  });

  it(`should update app pakcage.json and gatsby.config if gatsby-plugin-image is not installed`, async () => {
    tree.write(
      'package.json',
      JSON.stringify({
        dependencies: { 'gatsby-image': '*' },
        devDependencies: {},
      })
    );
    addProjectConfiguration(tree, 'app1', {
      root: 'apps/app1',
      name: 'app1',
      targets: {
        build: {
          executor: '@nx/gatsby:build',
        },
      },
    });

    tree.write('apps/app1/package.json', '{"dependencies":{}}');
    tree.write(
      'apps/app1/gatsby-config.js',
      `module.exports = {plugins: [
        \`gatsby-plugin-sharp\`,
        \`gatsby-transformer-sharp\`
      ]}`
    );
    await update(tree);

    const dependencies = readJson(tree, 'apps/app1/package.json').dependencies;
    expect(dependencies['gatsby-plugin-image']).toBeTruthy();
    expect(
      jestConfigObject(tree, 'apps/app1/gatsby-config.js').plugins
    ).toEqual([
      `gatsby-plugin-sharp`,
      'gatsby-plugin-image',
      `gatsby-transformer-sharp`,
    ]);
  });
});
