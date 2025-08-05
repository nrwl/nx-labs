import { CreateDependenciesContext, CreateNodesContextV2 } from '@nx/devkit';
import { join } from 'path';
import {
  createDependencies,
  createNodesV2,
  MavenPluginOptions,
} from './maven-plugin';

describe('Maven Plugin', () => {
  const testResourcesRoot = join(__dirname, '..', 'test', 'resources', 'unit');

  describe('interface validation', () => {
    it('should accept valid options', () => {
      const options: MavenPluginOptions = {
        verbose: true,
        mavenExecutable: 'mvn',
      };
      expect(options.verbose).toBe(true);
      expect(options.mavenExecutable).toBe('mvn');
    });

    it('should work with minimal options', () => {
      const options: MavenPluginOptions = {};
      expect(options.verbose).toBeUndefined();
      expect(options.mavenExecutable).toBeUndefined();
    });
  });

  describe('createNodesV2', () => {
    it('should return a function', () => {
      expect(typeof createNodesV2[1]).toBe('function');
    });

    it('should handle empty file list', async () => {
      const context: CreateNodesContextV2 = {
        nxJsonConfiguration: {},
        workspaceRoot: testResourcesRoot,
      };

      const options: MavenPluginOptions = {
        verbose: false,
      };

      const result = await createNodesV2[1]([], options, context);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('createDependencies', () => {
    it('should return an array', async () => {
      const context: CreateDependenciesContext = {
        nxJsonConfiguration: {},
        workspaceRoot: testResourcesRoot,
        externalNodes: {},
        projects: {},
        fileMap: { nonProjectFiles: [], projectFileMap: {} },
        filesToProcess: { nonProjectFiles: [], projectFileMap: {} },
      };

      const options: MavenPluginOptions = {
        verbose: false,
      };

      const result = await createDependencies(options, context);
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
