import {
  CreateDependencies,
  CreateDependenciesContext,
  DependencyType,
  readJsonFile,
  StaticDependency,
  validateDependency,
} from '@nx/devkit';

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ComposerJson } from '../utils/model';
import { ComposerPluginOptions } from './create-nodes';

export const createDependencies: CreateDependencies<
  ComposerPluginOptions
> = async (
  options: ComposerPluginOptions,
  context: CreateDependenciesContext
) => {
  const dependencies: Array<StaticDependency> = [];
  for (const [name, proj] of Object.entries(context.projects)) {
    const projectRoot = proj.root;
    const composerFilePath = join(
      context.workspaceRoot,
      projectRoot,
      'composer.json'
    );

    if (!existsSync(composerFilePath)) continue;
    const json = readJsonFile<ComposerJson>(composerFilePath);
    const deps = {
      ...json['require'],
      ...json['require-dev'],
    };
    Object.keys(deps).forEach((d) => {
      const sourceFile =
        projectRoot === '.' ? 'composer.json' : `${projectRoot}/composer.json`;
      if (context.projects[d]) {
        const dependency: StaticDependency = {
          source: proj.name,
          target: d,
          type: DependencyType.static,
          sourceFile,
        };
        validateDependency(dependency, context);
        dependencies.push(dependency);
      }
      if (context.externalNodes[`packagist:${d}`]) {
        const dependency: StaticDependency = {
          source: proj.name,
          target: `packagist:${d}`,
          type: DependencyType.static,
          sourceFile,
        };
        validateDependency(dependency, context);
        dependencies.push(dependency);
      }
    });
  }
  return dependencies;
};
