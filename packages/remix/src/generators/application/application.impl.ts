import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  offsetFromRoot,
  readJson,
  Tree,
  updateJson,

} from '@nrwl/devkit';
import { extractTsConfigBase } from '@nrwl/js/src/utils/typescript/create-ts-config';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import {
  eslintVersion,
  isbotVersion,
  reactDomVersion,
  reactVersion,
  remixVersion,
  typescriptVersion,
  typesReactDomVersion,
  typesReactVersion,
} from '../../utils/versions';
import { normalizeOptions } from './lib/normalize-options';
import { NxRemixGeneratorSchema } from './schema';

export default async function (tree: Tree, _options: NxRemixGeneratorSchema) {
  const options = normalizeOptions(tree, _options);
  const tasks: GeneratorCallback[] = [];

  addProjectConfiguration(tree, options.projectName, {
    root: options.projectRoot,
    sourceRoot: `${options.projectRoot}`,
    projectType: 'application',
    tags: options.parsedTags,
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
    updateJson(tree, 'package.json', (json) => {
      json['scripts'] = {
        build: 'nx exec -- remix build',
        dev: 'nx exec -- remix dev',
        start: 'nx exec -- remix-serve build',
        typecheck: 'nx exec -- tsc',
      };

      return json;
    });
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

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}
