import { readJson, readProjectConfiguration } from '@nx/devkit';
import { type ProjectNameAndRootFormat } from '@nx/devkit/src/generators/project-name-and-root-utils';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import applicationGenerator from '../application/application.impl';
import libraryGenerator from './library.impl';

describe('Remix Library Generator', () => {
  describe.each([
    ['derived', 'libs/test'],
    ['as-provided', 'test'],
  ])(
    '-projectNameAndRootFormat=%s',
    (projectNameAndRootFormat: ProjectNameAndRootFormat, libDir) => {
      it('should generate a library correctly', async () => {
        // ARRANGE
        const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

        // ACT
        await libraryGenerator(tree, {
          name: 'test',
          style: 'css',
          projectNameAndRootFormat,
        });

        // ASSERT
        const tsconfig = readJson(tree, 'tsconfig.base.json');
        expect(tree.exists(`${libDir}/src/server.ts`));
        expect(tree.children(`${libDir}/src/lib`)).toMatchSnapshot();
        expect(tsconfig.compilerOptions.paths).toMatchSnapshot();
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
          await libraryGenerator(tree, {
            name: 'test',
            style: 'css',
            projectNameAndRootFormat,
          });

          // ASSERT
          const updatedBaseTsConfig = readJson(tree, 'tsconfig.base.json');
          expect(
            Object.keys(originalBaseTsConfig.compilerOptions.paths)
          ).toContain('~/*');
          expect(
            Object.keys(updatedBaseTsConfig.compilerOptions.paths)
          ).toContain('~/*');
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
            projectNameAndRootFormat,
          });

          // ASSERT
          expect(tree.exists(`${libDir}/jest.config.ts`)).toBeFalsy();
          expect(tree.exists(`${libDir}/vite.config.ts`)).toBeFalsy();
        });

        it('should create the correct config files for testing with jest', async () => {
          // ARRANGE
          const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

          // ACT
          await libraryGenerator(tree, {
            name: 'test',
            style: 'css',
            unitTestRunner: 'jest',
            projectNameAndRootFormat,
          });

          // ASSERT
          expect(
            tree.read(`${libDir}/jest.config.ts`, 'utf-8')
          ).toMatchSnapshot();
          expect(tree.read(`${libDir}/src/test-setup.ts`, 'utf-8'))
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
            projectNameAndRootFormat,
          });

          // ASSERT
          expect(
            tree.read(`${libDir}/vite.config.ts`, 'utf-8')
          ).toMatchSnapshot();

          expect(tree.read(`${libDir}/src/test-setup.ts`, 'utf-8'))
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
          projectNameAndRootFormat,
        });

        // ASSERT
        const project = readProjectConfiguration(tree, 'test');
        const pkgJson = readJson(tree, `${libDir}/package.json`);
        expect(project.targets.build.options.format).toEqual(['cjs']);
        expect(project.targets.build.options.outputPath).toEqual(
          `${libDir}/dist`
        );
        expect(pkgJson.main).toEqual('./dist/index.cjs.js');
        expect(pkgJson.typings).toEqual('./dist/index.d.ts');
      });
    }
  );
});
