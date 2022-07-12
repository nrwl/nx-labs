import {
  detectPackageManager,
  ExecutorContext,
  getPackageManagerCommand,
  logger,
  names,
} from '@nrwl/devkit';
import { join } from 'path';
import { execSync } from 'child_process';

import { ensureNodeModulesSymlink } from '../../utils/ensure-node-modules-symlink';

import { ExpoEasBuildListOptions } from './schema';

export interface ReactNativeBuildListOutput {
  success: boolean;
}

export default async function* buildListExecutor(
  options: ExpoEasBuildListOptions,
  context: ExecutorContext
): AsyncGenerator<ReactNativeBuildListOutput> {
  const projectRoot = context.workspace.projects[context.projectName].root;
  ensureNodeModulesSymlink(context.root, projectRoot);

  logger.info(runCliBuildList(context.root, projectRoot, options));
  yield { success: true };
}

export function runCliBuildList(
  workspaceRoot: string,
  projectRoot: string,
  options: ExpoEasBuildListOptions
): string {
  const packageManager = detectPackageManager(workspaceRoot);
  const packageManagerCommand = getPackageManagerCommand(packageManager);
  return execSync(
    `${packageManagerCommand.exec} eas-cli build:list ${createBuildListOptions(
      options
    ).join(' ')}`,
    { cwd: join(workspaceRoot, projectRoot) }
  ).toString();
}

const nxOptions = ['output'];
function createBuildListOptions(options: ExpoEasBuildListOptions): string[] {
  return Object.keys(options).reduce((acc, k) => {
    const v = options[k];
    if (!nxOptions.includes(k)) {
      if (typeof v === 'boolean') {
        if (v === true) {
          // when true, does not need to pass the value true, just need to pass the flag in kebob case
          acc.push(`--${names(k).fileName}`);
        }
      } else {
        acc.push(`--${names(k).fileName}`, v);
      }
    }
    return acc;
  }, []);
}
