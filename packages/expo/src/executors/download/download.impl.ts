import { ExecutorContext, logger, names } from '@nrwl/devkit';
import {
  copyFile,
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
} from 'fs';
import fetch from 'node-fetch';
import { promisify } from 'util';
import { pipeline } from 'stream';
import * as chalk from 'chalk';
import { join } from 'path';
import * as tar from 'tar-fs';
import { createUnzip } from 'zlib';

import { ensureNodeModulesSymlink } from '../../utils/ensure-node-modules-symlink';

import { ExpoEasDownloadOptions } from './schema';
import { runCliBuildList } from '../build-list/build-list.impl';

export interface ReactNativeDownloadOutput {
  success: boolean;
}

const streamPipeline = promisify(pipeline);

/**
 * This executor downloads the latest EAS build.
 * It calls the build list exectuor to list EAS builds with options passed in.
 */
export default async function* downloadExecutor(
  options: ExpoEasDownloadOptions,
  context: ExecutorContext
): AsyncGenerator<ReactNativeDownloadOutput> {
  const projectRoot = context.workspace.projects[context.projectName].root;
  ensureNodeModulesSymlink(context.root, projectRoot);

  const build = getBuild(context.root, projectRoot, options);
  const buildUrl = build?.artifacts?.buildUrl;
  if (!buildUrl) {
    throw new Error(`No build URL found.`);
  }

  if (!existsSync(options.output)) {
    mkdirSync(options.output, { recursive: true });
  }

  const downloadFileName = buildUrl.split('/').pop();
  const downloadFilePath = join(options.output, downloadFileName);
  await downloadBuild(buildUrl, downloadFilePath);

  const appExtension = getAppExtension(build.platform, downloadFileName);
  const appName = `${names(build.project?.name).className}${appExtension}`;
  const outputFilePath = join(options.output, appName);

  if (downloadFileName.endsWith('.tar.gz')) {
    await unzipBuild(downloadFilePath, options.output);
  } else {
    await copyBuildFile(downloadFilePath, outputFilePath);
  }

  logger.info(`Succesfully download the build to ${outputFilePath}`);

  yield { success: true };
}

async function downloadBuild(buildUrl: string, output: string) {
  const response = await fetch(buildUrl);

  if (!response.ok)
    throw new Error(
      `Unable to download the build ${buildUrl}. Error: ${response.statusText}`
    );

  return streamPipeline(response.body, createWriteStream(output));
}

export function getBuild(
  workspaceRoot: string,
  projectRoot: string,
  options: ExpoEasDownloadOptions
) {
  const buildList = runCliBuildList(workspaceRoot, projectRoot, {
    ...options,
    json: true,
    status: 'finished',
    limit: 1,
  });
  const builds = JSON.parse(buildList);
  if (!builds.length) {
    throw new Error(
      `No EAS build found. Please check expo.dev to make sure your build is finished.`
    );
  }
  logger.info(`${chalk.bold.cyan('info')} Found build: ${buildList}`);

  return builds[0];
}

export function getAppExtension(
  platform: string,
  downloadFileName: string
): string {
  platform = platform.toLowerCase();
  if (platform === 'ios') {
    return '.app';
  }
  if (downloadFileName.includes('.')) {
    return `.${downloadFileName.split('.').pop()}`;
  }
  throw new Error(`Invalid build name found: ${downloadFileName}`);
}

export function unzipBuild(
  downloadFilePath: string,
  outputDirectoryPath: string
) {
  const unzip = createUnzip();
  const extract = tar.extract(outputDirectoryPath);
  return streamPipeline(createReadStream(downloadFilePath), unzip, extract);
}

export function copyBuildFile(
  downloadFilePath: string,
  outputFilePath: string
) {
  return new Promise<void>((resolve, reject) => {
    copyFile(downloadFilePath, outputFilePath, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
