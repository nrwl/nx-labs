import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  ensurePackage,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  offsetFromRoot,
  readJson,
  runTasksInSerial,
  toJS,
  Tree,
  updateJson,
} from '@nx/devkit';
import { extractTsConfigBase } from '@nx/js/src/utils/typescript/create-ts-config';
import {
  eslintVersion,
  getPackageVersion,
  isbotVersion,
  reactDomVersion,
  reactVersion,
  remixVersion,
  typescriptVersion,
  typesReactDomVersion,
  typesReactVersion,
} from '../../utils/versions';
import cypressGenerator from '../cypress/cypress.impl';
import { normalizeOptions, updateUnitTestConfig } from './lib';
import { NxRemixGeneratorSchema } from './schema';

export default async function (tree: Tree, _options: NxRemixGeneratorSchema) {
  const options = normalizeOptions(tree, _options);
  const tasks: GeneratorCallback[] = [];

  addProjectConfiguration(tree, options.projectName, {
    root: options.projectRoot,
    sourceRoot: `${options.projectRoot}`,
    projectType: 'application',
    tags: options.parsedTags,
    targets: {
      build: {
        executor: '@nx/remix:build',
        outputs: ['{options.outputPath}'],
        options: {
          outputPath: joinPathFragments('dist', options.projectRoot),
        },
      },
      serve: {
        executor: `@nx/remix:serve`,
        options: {
          port: 4200,
        },
      },
      start: {
        dependsOn: ['build'],
        command: `remix-serve build`,
        options: {
          cwd: options.projectRoot,
        },
      },
      typecheck: {
        command: `tsc`,
        options: {
          cwd: options.projectRoot,
        },
      },
    },
  });

  const installTask = addDependenciesToPackageJson(
    tree,
    {
      '@remix-run/node': remixVersion,
      '@remix-run/react': remixVersion,
      '@remix-run/serve': remixVersion,
      isbot: isbotVersion,
      react: reactVersion,
      'react-dom': reactDomVersion,
    },
    {
      '@remix-run/dev': remixVersion,
      '@remix-run/eslint-config': remixVersion,
      '@types/react': typesReactVersion,
      '@types/react-dom': typesReactDomVersion,
      eslint: eslintVersion,
      typescript: typescriptVersion,
    }
  );
  tasks.push(installTask);

  const vars = {
    ...options,
    tmpl: '',
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    remixVersion,
    isbotVersion,
    reactVersion,
    reactDomVersion,
    typesReactVersion,
    typesReactDomVersion,
    eslintVersion,
    typescriptVersion,
  };

  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files/common'),
    options.projectRoot,
    vars
  );

  if (options.rootProject) {
    const gitignore = tree.read('.gitignore', 'utf-8');
    tree.write(
      '.gitignore',
      `${gitignore}\n.cache\nbuild\npublic/build\n.env\n`
    );
  } else {
    generateFiles(
      tree,
      joinPathFragments(__dirname, 'files/integrated'),
      options.projectRoot,
      vars
    );
  }

  if (options.unitTestRunner !== 'none') {
    if (options.unitTestRunner === 'vitest') {
      const { vitestGenerator } = ensurePackage<typeof import('@nx/vite')>(
        '@nx/vite',
        getPackageVersion(tree, 'nx')
      );

      const vitestTask = await vitestGenerator(tree, {
        uiFramework: 'react',
        project: options.projectName,
        coverageProvider: 'c8',
        inSourceTests: false,
        skipFormat: true,
        testEnvironment: 'jsdom',
      });
      tasks.push(vitestTask);
    } else {
      const { jestProjectGenerator } = ensurePackage<typeof import('@nx/jest')>(
        '@nx/jest',
        getPackageVersion(tree, 'nx')
      );

      const jestTask = await jestProjectGenerator(tree, {
        project: options.projectName,
        skipFormat: true,
        setupFile: 'none',
        supportTsx: true,
      });

      tasks.push(jestTask);
    }

    const pkgInstallTask = updateUnitTestConfig(
      tree,
      options.projectRoot,
      options.unitTestRunner
    );
    tasks.push(pkgInstallTask);
  }

  if (options.js) {
    toJS(tree);
  }

  if (options.rootProject && tree.exists('tsconfig.base.json')) {
    // If this is a standalone project, merge tsconfig.json and tsconfig.base.json.
    const tsConfigBaseJson = readJson(tree, 'tsconfig.base.json');
    updateJson(tree, 'tsconfig.json', (json) => {
      delete json.extends;
      json.compilerOptions = {
        ...tsConfigBaseJson.compilerOptions,
        ...json.compilerOptions,
        // Taken from remix default setup
        // https://github.com/remix-run/remix/blob/68c8982/templates/remix/tsconfig.json#L15-L17
        paths: {
          '~/*': ['./app/*'],
        },
      };
      json.include = [
        ...(tsConfigBaseJson.include ?? []),
        ...(json.include ?? []),
      ];
      json.exclude = [
        ...(tsConfigBaseJson.exclude ?? []),
        ...(json.exclude ?? []),
      ];
      return json;
    });
    tree.delete('tsconfig.base.json');
  } else {
    // Otherwise, extract the tsconfig.base.json from tsconfig.json so we can share settings.
    extractTsConfigBase(tree);
  }

  if (options.e2eTestRunner === 'cypress') {
    const cypressTasks = await cypressGenerator(tree, {
      project: options.projectName,
      name: options.rootProject ? `e2e` : `${options.projectName}-e2e`,
    });
    tasks.push(cypressTasks);
  }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}
