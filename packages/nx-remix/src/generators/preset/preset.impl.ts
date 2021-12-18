import { execSync } from 'child_process';
import {
  readJson,
  writeJson,
  addProjectConfiguration,
  formatFiles,
  GeneratorCallback,
  Tree,
} from '@nrwl/devkit';
import { NxRemixGeneratorSchema } from './schema';
import { normalizeOptions } from './lib/normalize-options';

export default async function (
  tree: Tree,
  _options: NxRemixGeneratorSchema
): Promise<GeneratorCallback> {
  const options = normalizeOptions(tree, _options);

  addProjectConfiguration(tree, options.projectName, {
    root: options.projectRoot,
    projectType: 'library',
    sourceRoot: `${options.projectRoot}/src`,
    tags: options.parsedTags,
  });

  const nxJson = readJson(tree, 'nx.json');
  nxJson.workspaceLayout = {
    appsDir: 'packages',
    libsDir: 'packages',
  };
  writeJson(tree, 'nx.json', nxJson);

  tree.delete('apps');
  tree.delete('libs');
  tree.write('packages/.gitkeep', '');

  await formatFiles(tree);

  return () => {
    execSync(`npx -y create-remix`, {
      cwd: options.projectRoot,
      stdio: [0, 1, 2],
    });
  };
}
