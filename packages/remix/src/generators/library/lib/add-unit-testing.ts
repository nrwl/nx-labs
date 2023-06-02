import {
  addDependenciesToPackageJson,
  joinPathFragments,
  readProjectConfiguration,
  stripIndents,
  type Tree,
} from '@nx/devkit';
import {
  updateJestTestSetup,
  updateViteTestSetup,
} from '../../../utils/testing-config-utils';
import {
  testingLibraryJestDomVersion,
  testingLibraryReactVersion,
  testingLibraryUserEventsVersion,
} from '../../../utils/versions';
import type { RemixLibraryOptions } from './normalize-options';

export function addUnitTestingSetup(tree: Tree, options: RemixLibraryOptions) {
  const { root: projectRoot } = readProjectConfiguration(
    tree,
    options.projectName
  );
  const pathToTestSetup = joinPathFragments(projectRoot, 'src/test-setup.ts');
  let testSetupFileContents = '';

  if (tree.exists(pathToTestSetup)) {
    testSetupFileContents = tree.read(pathToTestSetup, 'utf-8');
  }

  tree.write(
    pathToTestSetup,
    stripIndents`${testSetupFileContents}
    import { installGlobals } from '@remix-run/node';
    import "@testing-library/jest-dom/extend-expect";
  installGlobals();`
  );

  if (options.unitTestRunner === 'vitest') {
    const pathToVitestConfig = joinPathFragments(projectRoot, `vite.config.ts`);
    updateViteTestSetup(tree, pathToVitestConfig, './src/test-setup.ts');
  } else if (options.unitTestRunner === 'jest') {
    const pathToJestConfig = joinPathFragments(projectRoot, `jest.config.ts`);
    updateJestTestSetup(tree, pathToJestConfig, './src/test-setup.ts');
  }

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
