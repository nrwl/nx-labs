import { names, Tree } from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/react/src/generators/library/library';
import { NxRemixGeneratorSchema } from './schema';
import { Linter } from '@nrwl/linter';

export default async function (tree: Tree, options: NxRemixGeneratorSchema) {
  const name = names(options.name).fileName;

  const task = await libraryGenerator(tree, {
    name,

    // Remix can only work with buildable libs and yarn/npm workspaces
    buildable: true,
    compiler: 'babel',

    style: 'css',
    unitTestRunner: 'jest',
    tags: options.tags,
    importPath: options.importPath,
    skipFormat: false,
    skipTsConfig: false,
    linter: Linter.EsLint,
    component: true,
  });

  return task;
}
