import {
  CreateDependencies,
  CreateDependenciesContext,
  DependencyType,
  readJsonFile,
  StaticDependency,
  validateDependency,
} from '@nx/devkit';

import { dirname, join } from 'node:path';
import { globWithWorkspaceContext } from 'nx/src/utils/workspace-context';
import { ComposerPluginOptions } from './create-nodes';

export const createDependencies: CreateDependencies<
  ComposerPluginOptions
> = async (
  options: ComposerPluginOptions,
  context: CreateDependenciesContext
) => {
  const files = await globWithWorkspaceContext(context.workspaceRoot, [
    '**/composer.json',
  ]);
  const dependencies: Array<StaticDependency> = [];

  for (const file of files) {
    const json = readJsonFile(join(context.workspaceRoot, file));
    const deps = {
      ...json['require'],
      ...json['require-dev'],
    };
    Object.keys(deps).forEach((d) => {
      const source = Object.values(context.projects).find(
        (proj) => proj.root === dirname(file)
      );
      if (!source) return;
      if (context.projects[d]) {
        const dependency: StaticDependency = {
          source: source.name,
          target: d,
          type: DependencyType.static,
          sourceFile: file,
        };
        validateDependency(dependency, context);
        dependencies.push(dependency);
      }
    });
  }
  // dependenciesFromReport.forEach((dependencyFromPlugin: StaticDependency) => {
  //   try {
  //     const source =
  //       relative(workspaceRoot, dependencyFromPlugin.source) || '.';
  //     const sourceProjectName =
  //       Object.values(context.projects).find(
  //         (project) => source === project.root
  //       )?.name ?? dependencyFromPlugin.source;
  //     const target =
  //       relative(workspaceRoot, dependencyFromPlugin.target) || '.';
  //     const targetProjectName =
  //       Object.values(context.projects).find(
  //         (project) => target === project.root
  //       )?.name ?? dependencyFromPlugin.target;
  //     if (
  //       !sourceProjectName ||
  //       !targetProjectName ||
  //       !existsSync(dependencyFromPlugin.sourceFile)
  //     ) {
  //       return;
  //     }
  //     const dependency: StaticDependency = {
  //       source: sourceProjectName,
  //       target: targetProjectName,
  //       type: DependencyType.static,
  //       sourceFile: normalizePath(
  //         relative(workspaceRoot, dependencyFromPlugin.sourceFile)
  //       ),
  //     };
  //     validateDependency(dependency, context);
  //     dependencies.push(dependency);
  //   } catch {
  //     logger.warn(
  //       `Unable to parse dependency from gradle plugin: ${dependencyFromPlugin.source} -> ${dependencyFromPlugin.target}`
  //     );
  //   }
  // });

  return dependencies;
};
