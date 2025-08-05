import { readJsonFile, workspaceRoot } from '@nx/devkit';
import { execSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';

/**
 * Gets the version of Nx to use for the test project
 * @returns The version of Nx to use for the test project
 */
export function getNxVersion() {
  const nxVersion = readJsonFile(join(workspaceRoot, 'package.json'))
    .devDependencies['nx'];
  return nxVersion;
}

/**
 * Creates a test project with Nx workspace, Maven project, and installs the plugin
 * @returns The directory where the test project was created
 */
export function createTestProject(nxVersion: string) {
  const projectName = 'test-workspace';
  const tmpDirectory = join(process.cwd(), 'tmp');
  const projectDirectory = join(tmpDirectory, projectName);

  // Ensure tmp directory exists and projectDirectory is empty
  rmSync(projectDirectory, {
    recursive: true,
    force: true,
  });
  mkdirSync(tmpDirectory, {
    recursive: true,
  });

  // Create Nx workspace
  execSync(
    `npx -y create-nx-workspace@${nxVersion} ${projectName} --preset apps --nxCloud=skip --no-interactive`,
    {
      cwd: tmpDirectory,
      stdio: 'inherit',
      env: process.env,
    }
  );

  // Create Maven project inside the workspace
  execSync(
    `mvn archetype:generate -DgroupId=com.example -DartifactId=my-app -DarchetypeArtifactId=maven-archetype-quickstart -DinteractiveMode=false`,
    {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    }
  );

  // Add the Maven plugin to the workspace
  execSync('npx nx add @nx/maven@e2e', {
    cwd: projectDirectory,
    stdio: 'inherit',
    env: process.env,
  });

  // Publish Maven plugin to local repository so it can be resolved by Maven
  publishMavenPluginLocally();

  console.log(`Created test project in "${projectDirectory}"`);

  return projectDirectory;
}

/**
 * Publishes the Maven plugin to local Maven repository
 * This makes the Java analyzer available for Maven to resolve during tests
 */
export function publishMavenPluginLocally() {
  const sourceMavenDir = join(workspaceRoot, 'packages', 'maven');

  console.log('Publishing Maven plugin to local repository...');

  // Install the Maven plugin to local repository (~/.m2/repository)
  execSync('mvn clean install -DskipTests', {
    cwd: sourceMavenDir,
    stdio: 'inherit',
    env: process.env,
  });

  console.log('Maven plugin published to local repository');
}

/**
 * Cleans up the test project
 * @param projectDirectory The directory where the test project was created
 */
export function cleanupTestProject(projectDirectory: string) {
  if (projectDirectory && !process.env.PRESERVE_TEST_PROJECT) {
    rmSync(projectDirectory, {
      recursive: true,
      force: true,
    });
  }
}
