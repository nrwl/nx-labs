import {
  formatFiles,
  generateFiles,
  readJson,
  Tree,
  writeJson,
} from '@nx/devkit';
import { join, resolve } from 'path';
import { LibraryGeneratorSchema } from './schema';

const minimumPhpVersion = '8.1';
const defaultVendorName = 'source';
const defaultRootProjectName = 'root';

export async function libraryGenerator(
  tree: Tree,
  options: LibraryGeneratorSchema
) {
  const rootComposerJsonPath = 'composer.json';
  const rootPackageJsonPath = 'package.json';

  const vendorName = getVendorName(tree, options);
  const projectName = getProjectName(tree, options);

  createRootComposerJsonIfNotExists(tree);

  generateFiles(tree, join(__dirname, 'files'), options.directory, {
    vendorName,
    projectName,
    minimumPhpVersion,
  });
  await formatFiles(tree);

  /**
   * Gets the project name from the options, defaulting to the directory name.
   */
  function getProjectName(tree: Tree, options: LibraryGeneratorSchema): string {
    if (options.projectName) {
      return options.projectName;
    }

    const normalizedPath = resolve(options.directory);
    return normalizedPath.split('/').pop();
  }

  /**
   * Gets the vendor name from the root composer.json file or the root package.json file.
   * If no vendor name is found, it will default to 'source'.
   */
  function getVendorName(tree: Tree, options: LibraryGeneratorSchema): string {
    if (options.vendorName) {
      return options.vendorName;
    }

    if (tree.exists(rootComposerJsonPath)) {
      const composerJson = readJson(tree, rootComposerJsonPath);
      if (composerJson.name) {
        return composerJson.name.split('/')[0];
      }
    }

    if (tree.exists(rootPackageJsonPath)) {
      const rootPackageJson = readJson(tree, rootPackageJsonPath);
      if (rootPackageJson.name) {
        // @ characters are not valid composer vendor names
        // so we remove them and use the rest as the vendor name
        // https://getcomposer.org/doc/04-schema.md#name
        return rootPackageJson.name.replace('@', '').split('/')[0];
      }
    }

    return defaultVendorName;
  }

  /**
   * Creates a root composer.json file if it does not exist.
   * If the root composer.json file does not exist, it will be created with the name matching the root package.json file.
   * If the root package.json file does not exist, then the name will default to 'source/root'.
   * PHP 8.1 is required.
   */
  function createRootComposerJsonIfNotExists(tree: Tree) {
    if (!tree.exists(rootComposerJsonPath)) {
      let rootComposerName = `${defaultVendorName}/${defaultRootProjectName}`;

      if (tree.exists(rootPackageJsonPath)) {
        const rootPackageJson = readJson(tree, rootPackageJsonPath);
        if (rootPackageJson.name) {
          // @ characters are not valid composer vendor names
          // so we remove them and use the rest as the name
          // https://getcomposer.org/doc/04-schema.md#name
          rootComposerName = rootPackageJson.name.replace('@', '');
        }
      }

      writeJson(tree, rootComposerJsonPath, {
        name: rootComposerName,
        description: 'The root Composer configuration for the monorepo.',
        'require-dev': {
          php: `>=${minimumPhpVersion}`,
        },
      });
    }
  }
}

export default libraryGenerator;
