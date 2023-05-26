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
      it('should generate the correct files for testing', async () => {
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
      it('should generate the correct files for testing', async () => {
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
  expect(targets.build.command).toEqual('remix build');
  expect(targets.build.options.cwd).toEqual(projectRoot);
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
