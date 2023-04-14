import {joinPathFragments, readProjectConfiguration, Tree} from "@nrwl/devkit";
import type { AppConfig } from '@remix-run/dev';

export function getRemixConfigPath(tree: Tree, projectName: string) {
  const project = readProjectConfiguration(tree, projectName);
  if (!project) throw new Error(`Project does not exist: ${projectName}`);

  return joinPathFragments(project.root, 'remix.config.js');
}

export function getRemixConfigValues(tree: Tree, projectName: string) {
  const remixConfigPath = getRemixConfigPath(tree, projectName);

  return eval(tree.read(remixConfigPath, 'utf-8')) as AppConfig;
}

export function getRemixFutureFlags(tree: Tree, projectName: string): AppConfig['future'] {
  const configValues = getRemixConfigValues(tree,projectName);

  return configValues?.future;

}
