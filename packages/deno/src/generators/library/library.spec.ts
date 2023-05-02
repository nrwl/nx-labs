import { readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { denoLibraryGenerator } from './library';

describe('Deno library', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should add a deno library', async () => {
    await denoLibraryGenerator(tree, { name: 'my-lib' });
    expect(tree.exists('libs/my-lib/mod.ts')).toBeTruthy();
    expect(tree.exists('libs/my-lib/deno.json')).toBeTruthy();
    expect(readJson(tree, 'import_map.json').imports).toEqual({
      '@proj/my-lib': './libs/my-lib/mod.ts',
    });
  });

  it('should add node entrypoint', async () => {
    await denoLibraryGenerator(tree, {
      name: 'my-lib',
      addNodeEntrypoint: true,
    });
    expect(tree.exists('libs/my-lib/node.ts')).toBeTruthy();
    expect(tree.exists('libs/my-lib/mod.ts')).toBeTruthy();
    expect(tree.exists('libs/my-lib/deno.json')).toBeTruthy();
    expect(readJson(tree, 'import_map.json').imports).toEqual({
      '@proj/my-lib': './libs/my-lib/mod.ts',
    });
    expect(readJson(tree, 'tsconfig.base.json').compilerOptions.paths).toEqual({
      '@proj/my-lib': ['libs/my-lib/node.ts'],
    });
  });
});
