import type { Tree } from '@nx/devkit';
import { formatFiles, GeneratorCallback, runTasksInSerial } from '@nx/devkit';
import { Linter } from '@nx/linter';
import { libraryGenerator } from '@nx/react';
import {
  addTsconfigEntryPoints,
  addUnitTestingSetup,
  normalizeOptions,
  updateBuildableConfig,
} from './lib';
import type { NxRemixGeneratorSchema } from './schema';

export default async function (tree: Tree, schema: NxRemixGeneratorSchema) {
  const tasks: GeneratorCallback[] = [];
  const options = normalizeOptions(tree, schema);

  const libGenTask = await libraryGenerator(tree, {
    name: options.name,
    style: options.style,
    unitTestRunner: options.unitTestRunner,
    tags: options.tags,
    importPath: options.importPath,
    directory: options.directory,
    skipFormat: true,
    skipTsConfig: false,
    linter: Linter.EsLint,
    component: true,
    buildable: options.buildable,
  });
  tasks.push(libGenTask);

  if (options.unitTestRunner && options.unitTestRunner !== 'none') {
    const pkgInstallTask = addUnitTestingSetup(tree, options);
    tasks.push(pkgInstallTask);
  }

  addTsconfigEntryPoints(tree, options);

  if (options.buildable) {
    updateBuildableConfig(tree, options.projectName);
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}
