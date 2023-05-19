import { readJson, Tree } from '@nx/devkit';

export const remixVersion = '^1.15.0';
export const isbotVersion = '^3.6.5';
export const reactVersion = '^18.2.0';
export const reactDomVersion = '^18.2.0';
export const typesReactVersion = '^18.0.25';
export const typesReactDomVersion = '^18.0.8';
export const eslintVersion = '^8.27.0';
export const typescriptVersion = '^4.8.4';
export const testingLibraryReactVersion = '^14.0.0';
export const testingLibraryJestDomVersion = '^5.16.5';
export const testingLibraryUserEventsVersion = '^14.4.3';

export function getRemixVersion(tree: Tree): string {
  return getPackageVersion(tree, '@remix-run/dev') ?? remixVersion;
}

export function getPackageVersion(tree: Tree, packageName: string) {
  const packageJsonContents = readJson(tree, 'package.json');
  return (
    packageJsonContents?.['devDependencies']?.[packageName] ??
    packageJsonContents?.['dependencies']?.[packageName] ??
    null
  );
}
