import {
  detectPackageManager,
  generateFiles,
  offsetFromRoot,
  PackageManager,
  toJS,
  Tree,
} from '@nrwl/devkit';
import { join } from 'path';
import { NormalizedSchema } from './normalize-options';

export function createApplicationFiles(host: Tree, options: NormalizedSchema) {
  const packageManagerLockFile: Record<PackageManager, string> = {
    npm: 'package-lock.json',
    yarn: 'yarn.lock',
    pnpm: 'pnpm-lock.yaml',
  };
  const packageManager = detectPackageManager(host.root);
  const packageLockFile = packageManagerLockFile[packageManager];
  generateFiles(host, join(__dirname, '../files'), options.appProjectRoot, {
    ...options,
    offsetFromRoot: offsetFromRoot(options.appProjectRoot),
    easBuildPath: '/Users/expo/workingdir/build',
    packageManager,
    packageLockFile,
  });
  if (options.unitTestRunner === 'none') {
    host.delete(join(options.appProjectRoot, `App.spec.tsx`));
  }
  if (options.js) {
    toJS(host);
  }
}
