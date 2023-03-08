import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  joinPathFragments,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
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
      '@remix-run/node': '^1.14.0',
      '@remix-run/react': '^1.14.0',
      '@remix-run/serve': '^1.14.0',
      isbot: '^3.6.5',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
    },
    {
      '@remix-run/dev': '^1.14.0',
      '@remix-run/eslint-config': '^1.14.0',
      '@types/react': '^18.0.25',
      '@types/react-dom': '^18.0.8',
      eslint: '^8.27.0',
      typescript: '^4.8.4',
    }
  );
  tasks.push(installTask);

  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    options.projectRoot,
    {
      ...options,
      tmpl: '',
      offsetFromRoot: offsetFromRoot(options.projectRoot),
    }
  );

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}
