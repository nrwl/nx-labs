import { names } from '@nx/devkit';

export function normalizeDirectory(
  appName: string,
  directoryName: string
): string {
  return directoryName
    ? `${names(directoryName).fileName}/${names(appName).fileName}`
    : names(appName).fileName;
}

export function normalizeProjectName(
  appName: string,
  directoryName: string
): string {
  return normalizeDirectory(appName, directoryName).replace(/\//g, '-');
}
