import {
  addDependenciesToPackageJson,
  joinPathFragments,
  readProjectConfiguration,
  stripIndents,
  type Tree,
} from '@nx/devkit';
import { tsquery } from '@phenomnomnominal/tsquery';
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
    updateViteTestSetup(tree, pathToVitestConfig);
  } else if (options.unitTestRunner === 'jest') {
    const pathToJestConfig = joinPathFragments(projectRoot, `jest.config.ts`);
    updateJestTestSetup(tree, pathToJestConfig);
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

function updateViteTestSetup(tree: Tree, pathToViteConfig: string) {
  const fileContents = tree.read(pathToViteConfig, 'utf-8');

  const ast = tsquery.ast(fileContents);

  const TEST_SETUPFILES_SELECTOR =
    'PropertyAssignment:has(Identifier[name=test]) PropertyAssignment:has(Identifier[name=setupFiles])';
  const nodes = tsquery(ast, TEST_SETUPFILES_SELECTOR, {
    visitAllChildren: true,
  });

  if (nodes.length === 0) {
    const TEST_CONFIG_SELECTOR =
      'PropertyAssignment:has(Identifier[name=test]) > ObjectLiteralExpression';
    const testConfigNodes = tsquery(ast, TEST_CONFIG_SELECTOR, {
      visitAllChildren: true,
    });
    const updatedFileContents = stripIndents`${fileContents.slice(
      0,
      testConfigNodes[0].getStart() + 1
    )}setupFiles: ['./src/test-setup.ts'],${fileContents.slice(
      testConfigNodes[0].getStart() + 1
    )}`;
    tree.write(pathToViteConfig, updatedFileContents);
  } else {
    const arrayNodes = tsquery(nodes[0], 'ArrayLiteralExpression', {
      visitAllChildren: true,
    });
    if (arrayNodes.length !== 0) {
      const updatedFileContents = stripIndents`${fileContents.slice(
        0,
        arrayNodes[0].getStart() + 1
      )}'./src/test-setup.ts',${fileContents.slice(
        arrayNodes[0].getStart() + 1
      )}`;

      tree.write(pathToViteConfig, updatedFileContents);
    }
  }
}

function updateJestTestSetup(tree: Tree, pathToJestConfig: string) {
  const fileContents = tree.read(pathToJestConfig, 'utf-8');

  const ast = tsquery.ast(fileContents);

  const TEST_SETUPFILES_SELECTOR =
    'PropertyAssignment:has(Identifier[name=setupFilesAfterEnv])';
  const nodes = tsquery(ast, TEST_SETUPFILES_SELECTOR, {
    visitAllChildren: true,
  });

  if (nodes.length === 0) {
    const CONFIG_SELECTOR = 'ObjectLiteralExpression';
    const nodes = tsquery(ast, CONFIG_SELECTOR, { visitAllChildren: true });

    const updatedFileContents = stripIndents`${fileContents.slice(
      0,
      nodes[0].getStart() + 1
    )}setupFilesAfterEnv: ['./src/test-setup.ts'],${fileContents.slice(
      nodes[0].getStart() + 1
    )}`;
    tree.write(pathToJestConfig, updatedFileContents);
  } else {
    const arrayNodes = tsquery(nodes[0], 'ArrayLiteralExpression', {
      visitAllChildren: true,
    });
    if (arrayNodes.length !== 0) {
      const updatedFileContents = stripIndents`${fileContents.slice(
        0,
        arrayNodes[0].getStart() + 1
      )}'./src/test-setup.ts',${fileContents.slice(
        arrayNodes[0].getStart() + 1
      )}`;

      tree.write(pathToJestConfig, updatedFileContents);
    }
  }
}
