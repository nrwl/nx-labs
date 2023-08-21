import type { Tree } from '@nx/devkit';
import { joinPathFragments, readJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import applicationGenerator from './application.impl';

describe('Remix Application', () => {
  describe('Standalone Project Repo', () => {
    it('should create the application correctly', async () => {
      // ARRANGE
      const tree = createTreeWithEmptyWorkspace();

      // ACT
      await applicationGenerator(tree, {
        name: 'test',
        rootProject: true,
      });

      // ASSERT
      expectTargetsToBeCorrect(tree, '.');

      expect(tree.read('remix.config.js', 'utf-8')).toMatchSnapshot();
      expect(tree.read('app/root.tsx', 'utf-8')).toMatchSnapshot();
      expect(tree.read('app/routes/index.tsx', 'utf-8')).toMatchSnapshot();
    });

    describe(`--js`, () => {
      it('should create the application correctly', async () => {
        // ARRANGE
        const tree = createTreeWithEmptyWorkspace();

        // ACT
        await applicationGenerator(tree, {
          name: 'test',
          js: true,
          rootProject: true,
        });

        // ASSERT
        expectTargetsToBeCorrect(tree, '.');

        expect(tree.read('remix.config.js', 'utf-8')).toMatchSnapshot();
        expect(tree.read('app/root.js', 'utf-8')).toMatchSnapshot();
        expect(tree.read('app/routes/index.js', 'utf-8')).toMatchSnapshot();
      });
    });

    describe('--unitTestRunner', () => {
      it('should generate the correct files for testing using vitest', async () => {
        // ARRANGE
        const tree = createTreeWithEmptyWorkspace();

        // ACT
        await applicationGenerator(tree, {
          name: 'test',
          unitTestRunner: 'vitest',
          rootProject: true,
        });

        // ASSERT
        expectTargetsToBeCorrect(tree, '.');

        expect(tree.read('remix.config.js', 'utf-8')).toMatchSnapshot();
        expect(tree.read('vite.config.ts', 'utf-8')).toMatchSnapshot();
        expect(tree.read('test-setup.ts', 'utf-8')).toMatchInlineSnapshot(`
          "import { installGlobals } from '@remix-run/node';
          import '@testing-library/jest-dom/extend-expect';
          installGlobals();
          "
        `);
      });

      it('should generate the correct files for testing using jest', async () => {
        // ARRANGE
        const tree = createTreeWithEmptyWorkspace();

        // ACT
        await applicationGenerator(tree, {
          name: 'test',
          unitTestRunner: 'jest',
          rootProject: true,
        });

        // ASSERT
        expectTargetsToBeCorrect(tree, '.');

        expect(tree.read('remix.config.js', 'utf-8')).toMatchSnapshot();
        expect(tree.read('jest.config.ts', 'utf-8')).toMatchSnapshot();
        expect(tree.read('test-setup.ts', 'utf-8')).toMatchInlineSnapshot(`
          "import { installGlobals } from '@remix-run/node';
          import '@testing-library/jest-dom/extend-expect';
          installGlobals();
          "
        `);
      });
    });

    describe('--e2eTestRunner', () => {
      it('should generate an e2e application for the app', async () => {
        // ARRANGE
        const tree = createTreeWithEmptyWorkspace();

        // ACT
        await applicationGenerator(tree, {
          name: 'test',
          e2eTestRunner: 'cypress',
          rootProject: true,
        });

        // ASSERT
        expectTargetsToBeCorrect(tree, '.');

        expect(tree.read('e2e/cypress.config.ts', 'utf-8'))
          .toMatchInlineSnapshot(`
          "import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
          import { defineConfig } from 'cypress';

          export default defineConfig({
            e2e: nxE2EPreset(__dirname),
          });
          "
        `);
      });
    });
  });

  describe('Integrated Repo', () => {
    it('should create the application correctly', async () => {
      // ARRANGE
      const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

      // ACT
      await applicationGenerator(tree, {
        name: 'test',
      });

      // ASSERT
      expectTargetsToBeCorrect(tree, 'apps/test');

      expect(tree.read('apps/test/remix.config.js', 'utf-8')).toMatchSnapshot();
      expect(tree.read('apps/test/app/root.tsx', 'utf-8')).toMatchSnapshot();
      expect(
        tree.read('apps/test/app/routes/index.tsx', 'utf-8')
      ).toMatchSnapshot();
    });

    describe('--js', () => {
      it('should create the application correctly', async () => {
        // ARRANGE
        const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

        // ACT
        await applicationGenerator(tree, {
          name: 'test',
          js: true,
        });

        // ASSERT
        expectTargetsToBeCorrect(tree, 'apps/test');

        expect(
          tree.read('apps/test/remix.config.js', 'utf-8')
        ).toMatchSnapshot();
        expect(tree.read('apps/test/app/root.js', 'utf-8')).toMatchSnapshot();
        expect(
          tree.read('apps/test/app/routes/index.js', 'utf-8')
        ).toMatchSnapshot();
      });
    });
    describe('--directory', () => {
      it('should create the application correctly', async () => {
        // ARRANGE
        const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

        // ACT
        await applicationGenerator(tree, {
          name: 'test',
          directory: 'demo',
        });

        // ASSERT
        expectTargetsToBeCorrect(tree, 'apps/demo/test');

        expect(
          tree.read('apps/demo/test/remix.config.js', 'utf-8')
        ).toMatchSnapshot();
        expect(
          tree.read('apps/demo/test/app/root.tsx', 'utf-8')
        ).toMatchSnapshot();
        expect(
          tree.read('apps/demo/test/app/routes/index.tsx', 'utf-8')
        ).toMatchSnapshot();
      });

      it('should extract the layout directory from the directory options if it exists', async () => {
        // ARRANGE
        const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

        // ACT
        await applicationGenerator(tree, {
          name: 'test',
          directory: 'apps/demo',
        });

        // ASSERT
        expectTargetsToBeCorrect(tree, 'apps/demo/test');

        expect(
          tree.read('apps/demo/test/remix.config.js', 'utf-8')
        ).toMatchSnapshot();
        expect(
          tree.read('apps/demo/test/app/root.tsx', 'utf-8')
        ).toMatchSnapshot();
        expect(
          tree.read('apps/demo/test/app/routes/index.tsx', 'utf-8')
        ).toMatchSnapshot();
      });
    });

    describe('--unitTestRunner', () => {
      it('should generate the correct files for testing using vitest', async () => {
        // ARRANGE
        const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

        // ACT
        await applicationGenerator(tree, {
          name: 'test',
          unitTestRunner: 'vitest',
        });

        // ASSERT
        expectTargetsToBeCorrect(tree, 'apps/test');

        expect(
          tree.read('apps/test/remix.config.js', 'utf-8')
        ).toMatchSnapshot();
        expect(
          tree.read('apps/test/vite.config.ts', 'utf-8')
        ).toMatchSnapshot();
        expect(tree.read('apps/test/test-setup.ts', 'utf-8'))
          .toMatchInlineSnapshot(`
          "import { installGlobals } from '@remix-run/node';
          import '@testing-library/jest-dom/extend-expect';
          installGlobals();
          "
        `);
      });

      it('should generate the correct files for testing using jest', async () => {
        // ARRANGE
        const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

        // ACT
        await applicationGenerator(tree, {
          name: 'test',
          unitTestRunner: 'jest',
        });

        // ASSERT
        expectTargetsToBeCorrect(tree, 'apps/test');

        expect(
          tree.read('apps/test/remix.config.js', 'utf-8')
        ).toMatchSnapshot();
        expect(
          tree.read('apps/test/jest.config.ts', 'utf-8')
        ).toMatchSnapshot();
        expect(tree.read('apps/test/test-setup.ts', 'utf-8'))
          .toMatchInlineSnapshot(`
          "import { installGlobals } from '@remix-run/node';
          import '@testing-library/jest-dom/extend-expect';
          installGlobals();
          "
        `);
      });
    });

    describe('--e2eTestRunner', () => {
      it('should generate an e2e application for the app', async () => {
        // ARRANGE
        const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

        // ACT
        await applicationGenerator(tree, {
          name: 'test',
          e2eTestRunner: 'cypress',
        });

        // ASSERT
        expectTargetsToBeCorrect(tree, 'apps/test');

        expect(tree.read('apps/test-e2e/cypress.config.ts', 'utf-8'))
          .toMatchInlineSnapshot(`
          "import { nxE2EPreset } from '@nx/cypress/plugins/cypress-preset';
          import { defineConfig } from 'cypress';

          export default defineConfig({
            e2e: nxE2EPreset(__dirname),
          });
          "
        `);
      });
    });
  });
});

function expectTargetsToBeCorrect(tree: Tree, projectRoot: string) {
  const { targets } = readJson(
    tree,
    joinPathFragments(projectRoot === '.' ? '/' : projectRoot, 'project.json')
  );
  expect(targets.build).toBeTruthy();
  expect(targets.build.executor).toEqual('@nx/remix:build');
  expect(targets.build.options.outputPath).toEqual(
    joinPathFragments('dist', projectRoot)
  );
  expect(targets.serve).toBeTruthy();
  expect(targets.serve.command).toEqual('remix dev');
  expect(targets.serve.options.cwd).toEqual(projectRoot);
  expect(targets.start).toBeTruthy();
  expect(targets.start.command).toEqual('remix-serve build');
  expect(targets.start.options.cwd).toEqual(projectRoot);
  expect(targets.typecheck).toBeTruthy();
  expect(targets.typecheck.command).toEqual('tsc');
  expect(targets.typecheck.options.cwd).toEqual(projectRoot);
}
