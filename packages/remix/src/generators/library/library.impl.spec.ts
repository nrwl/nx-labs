import { readJson, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import applicationGenerator from '../application/application.impl';
import libraryGenerator from './library.impl';

describe('Remix Library Generator', () => {
  it('should generate a library correctly', async () => {
    // ARRANGE
    const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

    // ACT
    await libraryGenerator(tree, {
      name: 'test',
      style: 'css',
    });

    // ASSERT
    const tsconfig = readJson(tree, 'tsconfig.base.json');
    expect(tree.exists('libs/test/src/server.ts'));
    expect(tree.children('libs/test/src/lib')).toMatchInlineSnapshot(`
      Array [
        "test.module.css",
        "test.spec.tsx",
        "test.tsx",
      ]
    `);
    expect(tsconfig.compilerOptions.paths).toMatchInlineSnapshot(`
      Object {
        "@proj/test": Array [
          "libs/test/src/index.ts",
        ],
        "@proj/test/server": Array [
          "libs/test/src/server.ts",
        ],
      }
    `);
  }, 25_000);

  describe('Standalone Project Repo', () => {
    it('should update the tsconfig paths correctly', async () => {
      // ARRANGE
      const tree = createTreeWithEmptyWorkspace();
      await applicationGenerator(tree, {
        name: 'demo',
        rootProject: true,
      });
      const originalBaseTsConfig = readJson(tree, 'tsconfig.json');

      // ACT
      await libraryGenerator(tree, { name: 'test', style: 'css' });

      // ASSERT
      const updatedBaseTsConfig = readJson(tree, 'tsconfig.base.json');
      expect(Object.keys(originalBaseTsConfig.compilerOptions.paths)).toContain(
        '~/*'
      );
      expect(Object.keys(updatedBaseTsConfig.compilerOptions.paths)).toContain(
        '~/*'
      );
    });
  });

  describe('--unitTestRunner', () => {
    it('should not create config files when unitTestRunner=none', async () => {
      // ARRANGE
      const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

      // ACT
      await libraryGenerator(tree, {
        name: 'test',
        style: 'css',
        unitTestRunner: 'none',
      });

      // ASSERT
      expect(tree.exists(`libs/test/jest.config.ts`)).toBeFalsy();
      expect(tree.exists(`libs/test/vite.config.ts`)).toBeFalsy();
    });

    it('should create the correct config files for testing with jest', async () => {
      // ARRANGE
      const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

      // ACT
      await libraryGenerator(tree, {
        name: 'test',
        style: 'css',
        unitTestRunner: 'jest',
      });

      // ASSERT
      expect(tree.read('libs/test/jest.config.ts', 'utf-8'))
        .toMatchInlineSnapshot(`
        "/* eslint-disable */
        export default {
          setupFilesAfterEnv: ['./src/test-setup.ts'],
          displayName: 'test',
          preset: '../../jest.preset.js',
          transform: {
            '^(?!.*\\\\\\\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
            '^.+\\\\\\\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
          },
          moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
          coverageDirectory: '../../coverage/libs/test',
        };
        "
      `);
      expect(tree.read('libs/test/src/test-setup.ts', 'utf-8'))
        .toMatchInlineSnapshot(`
        "import { installGlobals } from '@remix-run/node';
        import '@testing-library/jest-dom/extend-expect';
        installGlobals();
        "
      `);
    });

    it('should create the correct config files for testing with vitest', async () => {
      // ARRANGE
      const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

      // ACT
      await libraryGenerator(tree, {
        name: 'test',
        style: 'css',
        unitTestRunner: 'vitest',
      });

      // ASSERT
      expect(tree.read('libs/test/vite.config.ts', 'utf-8'))
        .toMatchInlineSnapshot(`
        "/// <reference types=\\"vitest\\" />
        import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
        import react from '@vitejs/plugin-react';
        import { defineConfig } from 'vite';

        export default defineConfig({
          cacheDir: '../../node_modules/.vite/test',

          plugins: [react(), nxViteTsPaths()],

          // Uncomment this if you are using workers.
          // worker: {
          //  plugins: [ nxViteTsPaths() ],
          // },

          test: {
            setupFiles: ['./src/test-setup.ts'],
            globals: true,
            cache: {
              dir: '../../node_modules/.vitest',
            },
            environment: 'jsdom',
            include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
          },
        });
        "
      `);

      expect(tree.read('libs/test/src/test-setup.ts', 'utf-8'))
        .toMatchInlineSnapshot(`
        "import { installGlobals } from '@remix-run/node';
        import '@testing-library/jest-dom/extend-expect';
        installGlobals();
        "
      `);
    }, 25_000);
  });

  // TODO(Colum): Unskip this when buildable is investigated correctly
  xit('should generate the config files correctly when the library is buildable', async () => {
    // ARRANGE
    const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

    // ACT
    await libraryGenerator(tree, {
      name: 'test',
      style: 'css',
      buildable: true,
    });

    // ASSERT
    const project = readProjectConfiguration(tree, 'test');
    const pkgJson = readJson(tree, 'libs/test/package.json');
    expect(project.targets.build.options.format).toEqual(['cjs']);
    expect(project.targets.build.options.outputPath).toEqual('libs/test/dist');
    expect(pkgJson.main).toEqual('./dist/index.cjs.js');
    expect(pkgJson.typings).toEqual('./dist/index.d.ts');
  });
});
