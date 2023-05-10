import { readJson, readProjectConfiguration } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
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
