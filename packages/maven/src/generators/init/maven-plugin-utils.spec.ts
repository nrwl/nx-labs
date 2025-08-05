import { Tree, logger } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import {
  addMavenPlugin,
  createMavenWrapperIfNeeded,
  detectMavenWrapper,
  getMavenExecutable,
} from './maven-plugin-utils';
import { InitGeneratorSchema } from './schema';

describe('maven-plugin-utils', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('detectMavenWrapper', () => {
    it('should return ./mvnw when wrapper exists', () => {
      tree.write('mvnw', '#!/bin/bash');

      const result = detectMavenWrapper(tree);

      expect(result).toBe('./mvnw');
    });

    it('should return ./mvnw when cmd wrapper exists', () => {
      tree.write('mvnw.cmd', '@echo off');

      const result = detectMavenWrapper(tree);

      expect(result).toBe('./mvnw');
    });

    it('should return mvn when no wrapper exists', () => {
      const result = detectMavenWrapper(tree);

      expect(result).toBe('mvn');
    });
  });

  describe('getMavenExecutable', () => {
    it('should return custom executable when provided', () => {
      const options: InitGeneratorSchema = {
        mavenExecutable: '/usr/local/bin/mvn',
      };

      const result = getMavenExecutable(tree, options);

      expect(result).toBe('/usr/local/bin/mvn');
    });

    it('should return wrapper when available', () => {
      tree.write('mvnw', '#!/bin/bash');

      const result = getMavenExecutable(tree, {});

      expect(result).toBe('./mvnw');
    });

    it('should return mvn as fallback', () => {
      const result = getMavenExecutable(tree, {});

      expect(result).toBe('mvn');
    });
  });

  describe('addMavenPlugin', () => {
    it('should warn when no pom.xml files exist', async () => {
      const warnSpy = jest.spyOn(logger, 'warn');

      await addMavenPlugin(tree, {});

      expect(warnSpy).toHaveBeenCalledWith(
        'No pom.xml files found in the workspace. Please ensure you have Maven projects configured.'
      );
    });

    it('should process pom.xml files', async () => {
      const pomContent = `<?xml version="1.0"?>
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>test-project</artifactId>
  <version>1.0.0</version>
  <build>
    <plugins>
    </plugins>
  </build>
</project>`;

      tree.write('pom.xml', pomContent);

      await addMavenPlugin(tree, {});

      const updatedContent = tree.read('pom.xml', 'utf-8');
      expect(updatedContent).toContain('dev.nx.maven');
      expect(updatedContent).toContain('project-graph');
    });

    it('should skip pom.xml files that already have the plugin', async () => {
      const pomContent = `<?xml version="1.0"?>
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>test-project</artifactId>
  <version>1.0.0</version>
  <build>
    <plugins>
      <plugin>
        <groupId>dev.nx.maven</groupId>
        <artifactId>project-graph</artifactId>
      </plugin>
    </plugins>
  </build>
</project>`;

      tree.write('pom.xml', pomContent);
      const infoSpy = jest.spyOn(logger, 'info');

      await addMavenPlugin(tree, {});

      expect(infoSpy).toHaveBeenCalledWith(
        'dev.nx.maven.project-graph plugin already configured in pom.xml'
      );
    });
  });

  describe('createMavenWrapperIfNeeded', () => {
    it('should create wrapper properties when no wrapper exists', () => {
      createMavenWrapperIfNeeded(tree);

      const wrapperProps = tree.read(
        '.mvn/wrapper/maven-wrapper.properties',
        'utf-8'
      );
      expect(wrapperProps).toContain('distributionUrl=');
      expect(wrapperProps).toContain('wrapperUrl=');
    });

    it('should not create wrapper when it already exists', () => {
      tree.write('mvnw', '#!/bin/bash');

      createMavenWrapperIfNeeded(tree);

      expect(tree.exists('.mvn/wrapper/maven-wrapper.properties')).toBe(false);
    });
  });
});
