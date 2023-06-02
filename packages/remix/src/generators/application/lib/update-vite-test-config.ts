import {
  addDependenciesToPackageJson,
  joinPathFragments,
  stripIndents,
  type Tree,
} from '@nx/devkit';
import {
  updateViteTestIncludes,
  updateViteTestSetup,
} from '../../../utils/testing-config-utils';
import {
  testingLibraryJestDomVersion,
  testingLibraryReactVersion,
  testingLibraryUserEventsVersion,
} from '../../../utils/versions';

export function updateViteTestConfig(tree: Tree, pathToRoot: string) {
  const pathToViteConfig = joinPathFragments(pathToRoot, 'vite.config.ts');
  const pathToTestSetup = joinPathFragments(pathToRoot, `test-setup.ts`);
  tree.write(
    pathToTestSetup,
    stripIndents`
  import { installGlobals } from '@remix-run/node';
  import '@testing-library/jest-dom/extend-expect';
  installGlobals();`
  );

  updateViteTestIncludes(
    tree,
    pathToViteConfig,
    './app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
  );
  updateViteTestSetup(tree, pathToViteConfig, './test-setup.ts');

  return addDependenciesToPackageJson(
    tree,
    {},
    {
      '@testing-library/jest-dom': testingLibraryJestDomVersion,
      '@testing-library/react': testingLibraryReactVersion,
      '@testing-library/user-event': testingLibraryUserEventsVersion,
    }
  );
}
