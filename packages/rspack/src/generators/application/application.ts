import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  ensurePackage,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  names,
  offsetFromRoot as _offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { version as nxVersion } from 'nx/package.json';
import * as path from 'path';
import {
  lessVersion,
  nestjsCommonVersion,
  nestjsCoreVersion,
  nestjsMicroservicesVersion,
  nestjsPlatformExpressVersion,
  reactDomVersion,
  reactVersion,
  sassVersion,
  stylusVersion,
  typesReactDomVersion,
  typesReactVersion,
} from '../../utils/versions';
import { configurationGenerator } from '../configuration/configuration';
import { addCypress } from './lib/add-cypress';
import { addJest } from './lib/add-jest';
import { addLinting } from './lib/add-linting';
import { createTsConfig } from './lib/create-ts-config';
import { normalizeOptions } from './lib/normalize-options';
import { ApplicationGeneratorSchema, NormalizedSchema } from './schema';

export default async function (
  tree: Tree,
  _options: ApplicationGeneratorSchema
) {
  const tasks = [];
  const options = normalizeOptions(tree, _options);

  await ensureRequiredPackages(tree, options);

  options.style ??= 'css';

  addProjectConfiguration(tree, options.name, {
    root: options.appProjectRoot,
    projectType: 'application',
    sourceRoot: `${options.appProjectRoot}/src`,
    targets: {},
  });

  const offsetFromRoot = _offsetFromRoot(options.appProjectRoot);
  generateFiles(tree, path.join(__dirname, applicationTemplateFolder(options)), options.appProjectRoot, {
    ...options,
    ...names(options.name),
    offsetFromRoot,
    template: '',
  });

  createTsConfig(
    tree,
    options,
    joinPathFragments(offsetFromRoot, 'tsconfig.base.json')
  );

  const projectTask = await buildProjectTask(tree, options);
  tasks.push(projectTask);

  const jestTask = await addJest(tree, options);
  tasks.push(jestTask);

  const cypressTask = await addCypress(tree, options);
  tasks.push(cypressTask);

  const lintTask = await addLinting(tree, options);
  tasks.push(lintTask);

  const installTask = await addFrameworkDependenciesToPackageJson(tree, options);
  tasks.push(installTask);

  switch (options.uiFramework) {
    case "react":
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { reactInitGenerator } = require('@nrwl/react');
      const reactInitTask = await reactInitGenerator(tree, options);
      tasks.push(reactInitTask);
      break;
  }

  await formatFiles(tree);

  return runTasksInSerial(...tasks);
}

function getStyleDependency(options: NormalizedSchema): Record<string, string> {
  if (options.style === 'scss') return { sass: sassVersion };
  if (options.style === 'less') return { less: lessVersion };
  if (options.style === 'styl') return { stylus: stylusVersion };
  return {};
}

async function ensureRequiredPackages(tree: Tree, options: NormalizedSchema) {
  switch (options.uiFramework) {
    case "nest":
      await ensurePackage(tree, '@nrwl/nest', nxVersion);
      break;
    case "react":
      await ensurePackage(tree, '@nrwl/react', nxVersion);
      break;
  }
}

async function buildProjectTask(tree: Tree, options: NormalizedSchema): Promise<GeneratorCallback> {
  switch (options.uiFramework) {
    case "nest":
      return await configurationGenerator(tree, {
        project: options.name,
        devServer: true,
        tsConfig: joinPathFragments(options.appProjectRoot, 'tsconfig.app.json'),
        framework: options.uiFramework,
        target: 'node',
        main: joinPathFragments(options.appProjectRoot, 'src/main.ts'),
        newProject: true,
      });
    default:
      return await configurationGenerator(tree, {
        project: options.name,
        devServer: true,
        tsConfig: joinPathFragments(options.appProjectRoot, 'tsconfig.app.json'),
        framework: 'react',
        target: 'web',
        main: joinPathFragments(options.appProjectRoot, 'src/main.tsx'),
        newProject: true,
      });
  }
}

async function addFrameworkDependenciesToPackageJson(tree: Tree, options: NormalizedSchema): Promise<GeneratorCallback> {
  switch (options.uiFramework) {
    case "nest":
      return addDependenciesToPackageJson(
        tree,
        { 
          '@nestjs/common': nestjsCommonVersion,
          '@nestjs/core': nestjsCoreVersion,
          '@nestjs/platform-express': nestjsPlatformExpressVersion,
          '@nestjs/microservices': nestjsMicroservicesVersion },
        {
          ...getStyleDependency(options),
        })
    default:
      return addDependenciesToPackageJson(
        tree,
        { react: reactVersion, 'react-dom': reactDomVersion },
        {
          ...getStyleDependency(options),
          '@nrwl/react': nxVersion,
          '@types/react': typesReactVersion,
          '@types/react-dom': typesReactDomVersion,
        })
  }
}


function applicationTemplateFolder(options: NormalizedSchema): string {
  switch (options.uiFramework) {
    case "nest":
      return "nest/files"
    default:
      return "react/files"
    }
}