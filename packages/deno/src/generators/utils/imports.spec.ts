import {
  addProjectConfiguration,
  ProjectConfiguration,
  readJson,
  Tree,
  updateJson,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import denoInit from '../init/generator';
import { createDenoAppForTesting } from '../utils/testing/deno-app';
import { addImports, getImportPathForProjectName } from './imports';

describe('import utils', () => {
  let tree: Tree;
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  describe('add imports', () => {
    it('should throw error if import_map.json is not found', () => {
      expect(() =>
        addImports(tree, {
          entryPoints: { deno: 'libs/deno-lib/mod.ts' },
          importPath: '@proj/deno-lib',
        })
      ).toThrowErrorMatchingInlineSnapshot(`
        "import_map.json does not exist in the root of the workspace.
        This means the workspace has not been initialized for Deno.
        You can do this by running 'nx g @nrwl/deno:init'"
      `);
    });

    it('should add import to import_map.json', async () => {
      await denoInit(tree);
      addImports(tree, {
        entryPoints: { deno: 'libs/deno-lib/mod.ts' },
        importPath: '@proj/deno-lib',
      });
      expect(
        readJson(tree, 'import_map.json').imports['@proj/deno-lib']
      ).toEqual('./libs/deno-lib/mod.ts');
    });

    it('should add node and deno imports', async () => {
      await denoInit(tree);
      addImports(tree, {
        entryPoints: {
          deno: './libs/deno-lib/mod.ts',
          node: 'libs/deno-lib/node.ts',
        },
        importPath: '@proj/deno-lib',
      });

      expect(
        readJson(tree, 'import_map.json').imports['@proj/deno-lib']
      ).toEqual(`./libs/deno-lib/mod.ts`);
      expect(
        readJson(tree, 'tsconfig.base.json').compilerOptions.paths[
          '@proj/deno-lib'
        ]
      ).toEqual(['libs/deno-lib/node.ts']);
    });

    it('should not add existing deno import', async () => {
      await denoInit(tree);
      addImports(tree, {
        entryPoints: { deno: 'libs/deno-lib/mod.ts' },
        importPath: '@proj/deno-lib',
      });
      expect(
        readJson(tree, 'import_map.json').imports['@proj/deno-lib']
      ).toEqual('./libs/deno-lib/mod.ts');
      expect(() => {
        addImports(tree, {
          entryPoints: { deno: 'libs/deno-lib/mod.ts' },
          importPath: '@proj/deno-lib',
        });
      }).toThrowErrorMatchingInlineSnapshot(`
        "Import path already exists in import_map.json for @proj/deno-lib.
        You can specify a different import path using the --import-path option.
        The value needs to be unique and not already used in the import_map.json file."
      `);
    });
    it('should not add existing tsconfig path', async () => {
      await denoInit(tree);
      addImports(tree, {
        entryPoints: {
          deno: 'libs/deno-lib/mod.ts',
          node: 'libs/deno-lib/node.ts',
        },
        importPath: '@proj/deno-lib',
      });
      expect(
        readJson(tree, 'import_map.json').imports['@proj/deno-lib']
      ).toEqual('./libs/deno-lib/mod.ts');
      updateJson(tree, 'import_map.json', (json) => {
        delete json.imports['@proj/deno-lib'];
        return json;
      });
      expect(() => {
        addImports(tree, {
          entryPoints: {
            deno: 'libs/deno-lib/mod.ts',
            node: 'libs/deno-lib/node.ts',
          },

          importPath: '@proj/deno-lib',
        });
      }).toThrowErrorMatchingInlineSnapshot(`
        "Import path already exists in tsconfig.base.json for @proj/deno-lib.
        You can specify a different import path using the --import-path option.
        The value needs to be unique and not already used in the tsconfig.base.json file."
      `);
    });
  });

  describe('read tsconfig paths', () => {
    it('should get tsconfig path for a project', async () => {
      const pc = await addNodeAndDenoProjects(tree, 'proj');
      const actual = getImportPathForProjectName(tree, pc);
      expect(actual).toEqual({
        importAlias: '@proj/proj-node',
        importPath: 'libs/proj-node/src/index.ts',
      });
    });

    it('should throw error if no tsconfig.base.json', async () => {
      const pc = await addNodeAndDenoProjects(tree, 'proj');
      tree.delete('tsconfig.base.json');
      expect(() => getImportPathForProjectName(tree, pc))
        .toThrowErrorMatchingInlineSnapshot(`
        "Could not find a root tsconfig.json or tsconfig.base.json to import paths from.
        A root tsconfig is required in order to use an existing import path from another project."
      `);
    });

    it('should throw error if no path was found', async () => {
      const pc = await addNodeAndDenoProjects(tree, 'proj');
      updateJson(tree, 'tsconfig.base.json', (json) => {
        delete json.compilerOptions.paths[`@proj/proj-node`];
        return json;
      });
      expect(() =>
        getImportPathForProjectName(tree, pc)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Unable to find any import path in tsconfig.base.json for project proj-node"`
      );
    });
  });
});

async function addNodeAndDenoProjects(tree: Tree, name: string) {
  createDenoAppForTesting(tree, {
    name: `${name}-deno`,
    projectRoot: `libs/${name}-deno`,
    parsedTags: [],
    projectDirectory: `libs/${name}-deno/src`,
    projectName: `${name}-deno`,
  });
  const pc: ProjectConfiguration = {
    name: `${name}-node`,
    root: `libs/${name}-node`,
    sourceRoot: `libs/${name}-node/src`,
    projectType: 'library',
    targets: {
      build: {
        executor: '@nrwl/esbuild:esbuild',
        options: {},
      },
    },
  };
  tree.write(`libs/${name}-node/src/index.ts`, '');
  addProjectConfiguration(tree, `${name}-node`, pc);
  updateJson(tree, 'tsconfig.base.json', (json) => {
    json.compilerOptions.paths[`@proj/abc`] = [`libs/abc/src/index.ts`];
    json.compilerOptions.paths[`@proj/${name}-123`] = [
      '*',
      `libs/${name}-node-wrong/src/index.ts`,
    ];
    json.compilerOptions.paths[`@proj/blah`] = [`libs/not-it/src/index.ts`];
    json.compilerOptions.paths[`@proj/${name}-node`] = [
      `libs/${name}-node/src/index.ts`,
    ];
    return json;
  });

  // TODO(caleb): calling readProjectConfiguration causes tests to just error, with no error message
  return pc;
}
