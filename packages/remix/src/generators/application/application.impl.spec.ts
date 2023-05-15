import { readJson } from '@nx/devkit';
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
      const { targets } = readJson(tree, 'project.json');
      expect(targets.build).toBeTruthy();
      expect(targets.build.command).toEqual('remix build');
      expect(targets.build.options.cwd).toEqual('.');
      expect(targets.serve).toBeTruthy();
      expect(targets.serve.command).toEqual('remix dev');
      expect(targets.serve.options.cwd).toEqual('.');
      expect(targets.start).toBeTruthy();
      expect(targets.start.command).toEqual('remix-serve build');
      expect(targets.start.options.cwd).toEqual('.');
      expect(targets.typecheck).toBeTruthy();
      expect(targets.typecheck.command).toEqual('tsc');
      expect(targets.typecheck.options.cwd).toEqual('.');

      expect(tree.read('remix.config.js', 'utf-8')).toMatchSnapshot();
      expect(tree.read('app/root.tsx', 'utf-8')).toMatchSnapshot();
      expect(tree.read('app/routes/index.tsx', 'utf-8')).toMatchSnapshot();
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
      const { targets } = readJson(tree, 'apps/test/project.json');
      expect(targets.build).toBeTruthy();
      expect(targets.build.command).toEqual('remix build');
      expect(targets.build.options.cwd).toEqual('apps/test');
      expect(targets.serve).toBeTruthy();
      expect(targets.serve.command).toEqual('remix dev');
      expect(targets.serve.options.cwd).toEqual('apps/test');
      expect(targets.start).toBeTruthy();
      expect(targets.start.command).toEqual('remix-serve build');
      expect(targets.start.options.cwd).toEqual('apps/test');
      expect(targets.typecheck).toBeTruthy();
      expect(targets.typecheck.command).toEqual('tsc');
      expect(targets.typecheck.options.cwd).toEqual('apps/test');

      expect(tree.read('apps/test/remix.config.js', 'utf-8')).toMatchSnapshot();
      expect(tree.read('apps/test/app/root.tsx', 'utf-8')).toMatchSnapshot();
      expect(
        tree.read('apps/test/app/routes/index.tsx', 'utf-8')
      ).toMatchSnapshot();
    });
  });
});
