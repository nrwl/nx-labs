import {
  addProjectConfiguration,
  joinPathFragments,
  readJson,
  readWorkspaceConfiguration,
  Tree,
  updateWorkspaceConfiguration,
} from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import update from './update-tsconfig-and-remix-config-for-1-6-8';

describe('Update remix.config', () => {
  it('should add watchPaths', async () => {
    const tree = createTreeWithEmptyWorkspace();
    createLegacyRemixApp(tree, 'remix', 'apps/remix');

    await update(tree);

    expect(tree.read('apps/remix/remix.config.js', 'utf-8')).toContain(
      `watchPaths: ['../../libs']`
    );
  });

  it('should account for workspaceLayout', async () => {
    const tree = createTreeWithEmptyWorkspace();
    createLegacyRemixApp(tree, 'remix', 'apps/remix');

    const workspaceConfig = readWorkspaceConfiguration(tree);
    updateWorkspaceConfiguration(tree, {
      ...workspaceConfig,
      workspaceLayout: { appsDir: 'apps', libsDir: 'some-libs' },
    });

    await update(tree);

    expect(tree.read('apps/remix/remix.config.js', 'utf-8')).toContain(
      `watchPaths: ['../../some-libs']`
    );
  });

  it('should account for nested apps', async () => {
    const tree = createTreeWithEmptyWorkspace();
    createLegacyRemixApp(tree, 'nested-remix', 'apps/very/very/nested/remix');

    await update(tree);

    expect(
      tree.read('apps/very/very/nested/remix/remix.config.js', 'utf-8')
    ).toContain(`watchPaths: ['../../../../../libs']`);
  });

  it('should update multiple apps', async () => {
    const tree = createTreeWithEmptyWorkspace();
    createLegacyRemixApp(tree, 'remix', 'apps/remix');
    createLegacyRemixApp(tree, 'another-remix', 'apps/another-remix');

    await update(tree);

    expect(tree.read('apps/remix/remix.config.js', 'utf-8')).toContain(
      `watchPaths: ['../../libs']`
    );
    expect(tree.read('apps/another-remix/remix.config.js', 'utf-8')).toContain(
      `watchPaths: ['../../libs']`
    );
  });

  it('should not touch non-Remix apps', async () => {
    const tree = createTreeWithEmptyWorkspace();
    createLegacyRemixApp(tree, 'remix', 'apps/remix');
    addProjectConfiguration(tree, 'not-remix', {
      root: 'apps/not-remix',
      sourceRoot: 'apps/not-remix/src',
    });

    await update(tree);

    expect(tree.read('apps/remix/remix.config.js', 'utf-8')).toContain(
      `watchPaths: ['../../libs']`
    );
    expect(tree.exists('apps/not-remix/remix.config.js')).toBe(false);
  });
});

describe('Update app tsconfig.json', () => {
  it('should remove `basePath`', async () => {
    const tree = createTreeWithEmptyWorkspace();
    createLegacyRemixApp(tree, 'remix', 'apps/remix');

    await update(tree);

    expect(tree.read('apps/remix/tsconfig.json', 'utf-8')).not.toContain(
      `basePath`
    );
  });

  it('should add `extends`', async () => {
    const tree = createTreeWithEmptyWorkspace();
    createLegacyRemixApp(tree, 'remix', 'apps/remix');

    await update(tree);

    expect(tree.read('apps/remix/tsconfig.json', 'utf-8')).toContain(
      `"extends": "../../tsconfig.base.json"`
    );
  });

  it('should account for nested apps', async () => {
    const tree = createTreeWithEmptyWorkspace();
    createLegacyRemixApp(tree, 'nested-remix', 'apps/very/very/nested/remix');

    await update(tree);

    expect(
      tree.read('apps/very/very/nested/remix/tsconfig.json', 'utf-8')
    ).toContain(`"extends": "../../../../../tsconfig.base.json"`);
  });

  it('should remove `paths` for a single app workspace', async () => {
    const tree = createTreeWithEmptyWorkspace();
    createLegacyRemixApp(tree, 'remix', 'apps/remix');

    await update(tree);

    expect(tree.read('apps/remix/tsconfig.json', 'utf-8')).not.toContain(
      `"paths": `
    );
  });

  it('should not remove `paths` for a multiple app workspace', async () => {
    const tree = createTreeWithEmptyWorkspace();
    createLegacyRemixApp(tree, 'remix', 'apps/remix');
    createLegacyRemixApp(tree, 'another-remix', 'apps/another-remix');

    await update(tree);

    expect(tree.read('apps/remix/tsconfig.json', 'utf-8')).toContain(
      `"paths": `
    );
    expect(tree.read('apps/another-remix/tsconfig.json', 'utf-8')).toContain(
      `"paths": `
    );
  });

  it('should not touch non-Remix apps', async () => {
    const tree = createTreeWithEmptyWorkspace();
    createLegacyRemixApp(tree, 'remix', 'apps/remix');
    addProjectConfiguration(tree, 'not-remix', {
      root: 'apps/not-remix',
      sourceRoot: 'apps/not-remix/src',
    });

    const notRemixTsConfigJson = `
          {
            "extends": "../../../../tsconfig.base.json",
            "compilerOptions": {
              "jsx": "react-jsx",
              "allowJs": true,
              "esModuleInterop": true,
              "allowSyntheticDefaultImports": true,
              "forceConsistentCasingInFileNames": true,
              "strict": true,
              "noImplicitOverride": true,
              "noPropertyAccessFromIndexSignature": true,
              "noImplicitReturns": true,
              "noFallthroughCasesInSwitch": true
            },
            "files": [],
            "include": [],
            "references": [
              {
                "path": "./tsconfig.app.json"
              },
              {
                "path": "./tsconfig.spec.json"
              }
            ]
          }`;

    tree.write('apps/not-remix/tsconfig.json', notRemixTsConfigJson);

    await update(tree);

    expect(tree.read('apps/not-remix/tsconfig.json', 'utf-8')).toEqual(
      notRemixTsConfigJson
    );
  });
});

describe('Update tsconfig.base.json', () => {
  it('should update paths for single app workspace', async () => {
    const tree = createTreeWithEmptyWorkspace();
    createLegacyRemixApp(tree, 'remix', 'apps/remix');

    await update(tree);

    expect(readJson(tree, 'tsconfig.base.json')).toMatchObject(
      expect.objectContaining({
        compilerOptions: {
          paths: {
            '~/*': ['apps/remix/app/*'],
          },
        },
      })
    );
  });

  it('should not update paths for multiple app workspace', async () => {
    const tree = createTreeWithEmptyWorkspace();
    createLegacyRemixApp(tree, 'remix', 'apps/remix');
    createLegacyRemixApp(tree, 'another-remix', 'apps/another-remix');

    await update(tree);

    expect(readJson(tree, 'tsconfig.base.json')).not.toMatchObject(
      expect.objectContaining({
        compilerOptions: {
          paths: {
            '~/*': ['apps/remix/app/*'],
          },
        },
      })
    );
  });

  it('should not update if workspace does not contain a remix app', async () => {
    const tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, 'not-remix', {
      root: 'apps/not-remix',
      sourceRoot: 'apps/not-remix/src',
    });

    const currentTsConfigBaseJson = tree.read('tsconfig.base.json');

    await update(tree);

    expect(tree.read('tsconfig.base.json')).toEqual(currentTsConfigBaseJson);
  });
});

function createLegacyRemixApp(tree: Tree, name: string, root: string) {
  addProjectConfiguration(tree, name, {
    root,
    sourceRoot: root,
  });

  tree.write(
    joinPathFragments(root, 'remix.config.js'),
    `
       /**
       * @type {import('@remix-run/dev').AppConfig}
       */
      module.exports = {
        ignoredRouteFiles: ['**/.*'],
        // appDirectory: 'app',
        // assetsBuildDirectory: 'public/build',
        // serverBuildPath: 'build/index.js',
        // publicPath: '/build/',
      };
      `
  );

  tree.write(
    joinPathFragments(root, 'tsconfig.json'),
    `
          {
            "include": ["remix.env.d.ts", "**/*.ts", "**/*.tsx"],
            "compilerOptions": {
              "lib": ["DOM", "DOM.Iterable", "ES2019"],
              "isolatedModules": true,
              "esModuleInterop": true,
              "jsx": "react-jsx",
              "moduleResolution": "node",
              "resolveJsonModule": true,
              "target": "ES2019",
              "strict": true,
              "allowJs": true,
              "forceConsistentCasingInFileNames": true,
              "baseUrl": ".",
              "paths": {
                "~/*": ["./app/*"]
              },

              // Remix takes care of building everything in \`remix build\`.
              "noEmit": true
            }
          }`
  );
}
