import { readJson, readProjectConfiguration, Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { denoApplicationGenerator } from './application';

describe('Deno App Generator', () => {
  let tree: Tree;
  describe('standalone', () => {
    beforeEach(() => {
      tree = createTreeWithEmptyWorkspace();
    });

    it('should make a deno app', async () => {
      await denoApplicationGenerator(tree, {
        name: 'my-app',
        rootProject: true,
      });
      expect(readJson(tree, 'deno.json')).toEqual({
        importMap: 'import_map.json',
      });
      expect(readProjectConfiguration(tree, 'my-app')).toMatchSnapshot();
      expect(tree.exists('src/main.ts')).toBeTruthy();
    });

    it('should create --platform=netlify app', async () => {
      await denoApplicationGenerator(tree, {
        name: 'my-app-netlify',
        rootProject: true,
        platform: 'netlify',
      });
      expect(readJson(tree, 'deno.json')).toEqual({
        importMap: 'import_map.json',
      });
      expect(
        readProjectConfiguration(tree, 'my-app-netlify')
      ).toMatchSnapshot();
      expect(tree.read('netlify.toml', 'utf-8')).toMatchSnapshot();
      expect(tree.exists('src/app.ts')).toBeTruthy();
    });

    it('should make an oak api with --framework=oak', async () => {
      await denoApplicationGenerator(tree, {
        name: 'my-oak-api',
        rootProject: true,
        framework: 'oak',
      });

      expect(readJson(tree, 'deno.json')).toEqual({
        importMap: 'import_map.json',
      });
      expect(readProjectConfiguration(tree, 'my-oak-api')).toMatchSnapshot();
      expect(tree.read('src/main.ts', 'utf-8')).toMatchSnapshot();
    });
  });

  describe('integrated', () => {
    beforeEach(() => {
      tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    });

    it('should make an integrated deno app', async () => {
      await denoApplicationGenerator(tree, {
        name: 'my-app',
      });
      expect(readJson(tree, 'apps/my-app/deno.json')).toEqual({
        importMap: '../../import_map.json',
      });
      expect(readProjectConfiguration(tree, 'my-app')).toMatchSnapshot();
      expect(tree.exists('apps/my-app/src/main.ts')).toBeTruthy();
    });

    it('should create --platform=netlify integrated app', async () => {
      await denoApplicationGenerator(tree, {
        name: 'my-app-netlify',
        platform: 'netlify',
      });

      expect(readJson(tree, 'apps/my-app-netlify/deno.json')).toEqual({
        importMap: '../../import_map.json',
      });
      expect(
        readProjectConfiguration(tree, 'my-app-netlify')
      ).toMatchSnapshot();
      expect(tree.read('netlify.toml', 'utf-8')).toMatchSnapshot();
      expect(tree.exists('apps/my-app-netlify/src/app.ts')).toBeTruthy();
    });

    it('should make an oak api with --framework=oak', async () => {
      await denoApplicationGenerator(tree, {
        name: 'my-oak-api',
        framework: 'oak',
      });
      expect(readJson(tree, 'apps/my-oak-api/deno.json')).toEqual({
        importMap: '../../import_map.json',
      });
      expect(readProjectConfiguration(tree, 'my-oak-api')).toMatchSnapshot();
      expect(
        tree.read('apps/my-oak-api/src/main.ts', 'utf-8')
      ).toMatchSnapshot();
    });
  });
});
