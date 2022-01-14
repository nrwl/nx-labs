import {
  ensureNxProject,
  runPackageManagerInstall,
} from '@nrwl/nx-plugin/testing';

beforeEach(() => {
  ensureNxProject('@nrwl/expo', 'dist/packages/expo');
  runPackageManagerInstall();
});
