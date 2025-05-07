import { readJson, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';

import { libraryGenerator } from './library';
import { LibraryGeneratorSchema } from './schema';

describe('library generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('when no root composer.json exists', () => {
    it('should generate a composer library with the default vendor name and project name', async () => {
      const options: LibraryGeneratorSchema = {
        directory: 'test',
      };

      await libraryGenerator(tree, options);

      expect(tree.exists('composer.json')).toBe(true);
      expect(readJson(tree, 'composer.json')).toMatchInlineSnapshot(`
        Object {
          "description": "The root Composer configuration for the monorepo.",
          "name": "proj/source",
          "require-dev": Object {
            "php": ">=8.1",
          },
        }
      `);
      expect(tree.exists('test/composer.json')).toBe(true);
      expect(readJson(tree, 'test/composer.json')).toMatchInlineSnapshot(`
        Object {
          "name": "proj/test",
          "require": Object {
            "php": ">=8.1",
          },
        }
      `);
    });

    it('should generate a composer library with the default vendor name and specified project name', async () => {
      const options: LibraryGeneratorSchema = {
        directory: 'test',
        projectName: 'my-project',
      };

      await libraryGenerator(tree, options);

      expect(tree.exists('composer.json')).toBe(true);
      expect(readJson(tree, 'composer.json')).toMatchInlineSnapshot(`
        Object {
          "description": "The root Composer configuration for the monorepo.",
          "name": "proj/source",
          "require-dev": Object {
            "php": ">=8.1",
          },
        }
      `);
      expect(tree.exists('test/composer.json')).toBe(true);
      expect(readJson(tree, 'test/composer.json')).toMatchInlineSnapshot(`
        Object {
          "name": "proj/my-project",
          "require": Object {
            "php": ">=8.1",
          },
        }
      `);
    });

    it('should generate a composer library with the specified vendor name and default project name', async () => {
      const options: LibraryGeneratorSchema = {
        directory: 'test',
        vendorName: 'my-vendor',
      };

      await libraryGenerator(tree, options);

      expect(tree.exists('composer.json')).toBe(true);
      expect(readJson(tree, 'composer.json')).toMatchInlineSnapshot(`
        Object {
          "description": "The root Composer configuration for the monorepo.",
          "name": "proj/source",
          "require-dev": Object {
            "php": ">=8.1",
          },
        }
      `);
      expect(tree.exists('test/composer.json')).toBe(true);
      expect(readJson(tree, 'test/composer.json')).toMatchInlineSnapshot(`
        Object {
          "name": "my-vendor/test",
          "require": Object {
            "php": ">=8.1",
          },
        }
      `);
    });

    it('should generate a composer library with the specified vendor name and project name', async () => {
      const options: LibraryGeneratorSchema = {
        directory: 'test',
        vendorName: 'my-vendor',
        projectName: 'my-project',
      };

      await libraryGenerator(tree, options);

      expect(tree.exists('composer.json')).toBe(true);
      expect(readJson(tree, 'composer.json')).toMatchInlineSnapshot(`
        Object {
          "description": "The root Composer configuration for the monorepo.",
          "name": "proj/source",
          "require-dev": Object {
            "php": ">=8.1",
          },
        }
      `);
      expect(tree.exists('test/composer.json')).toBe(true);
      expect(readJson(tree, 'test/composer.json')).toMatchInlineSnapshot(`
        Object {
          "name": "my-vendor/my-project",
          "require": Object {
            "php": ">=8.1",
          },
        }
      `);
    });
  });

  describe('when a root composer.json exists', () => {
    it('should generate a composer library with the default vendor name and project name', async () => {
      tree.write('composer.json', JSON.stringify({ name: 'proj/source' }));

      const options: LibraryGeneratorSchema = {
        directory: 'test',
      };

      await libraryGenerator(tree, options);

      expect(tree.exists('test/composer.json')).toBe(true);
      expect(readJson(tree, 'test/composer.json')).toMatchInlineSnapshot(`
        Object {
          "name": "proj/test",
          "require": Object {
            "php": ">=8.1",
          },
        }
      `);
    });

    it('should generate a composer library with the specified vendor name and default project name', async () => {
      tree.write('composer.json', JSON.stringify({ name: 'proj/source' }));

      const options: LibraryGeneratorSchema = {
        directory: 'test',
        vendorName: 'my-vendor',
      };

      await libraryGenerator(tree, options);

      expect(tree.exists('test/composer.json')).toBe(true);
      expect(readJson(tree, 'test/composer.json')).toMatchInlineSnapshot(`
        Object {
          "name": "my-vendor/test",
          "require": Object {
            "php": ">=8.1",
          },
        }
      `);
    });

    it('should generate a composer library with the specified vendor name and project name', async () => {
      tree.write('composer.json', JSON.stringify({ name: 'proj/source' }));

      const options: LibraryGeneratorSchema = {
        directory: 'test',
        vendorName: 'my-vendor',
        projectName: 'my-project',
      };

      await libraryGenerator(tree, options);

      expect(tree.exists('test/composer.json')).toBe(true);
      expect(readJson(tree, 'test/composer.json')).toMatchInlineSnapshot(`
        Object {
          "name": "my-vendor/my-project",
          "require": Object {
            "php": ">=8.1",
          },
        }
      `);
    });
  });
});
