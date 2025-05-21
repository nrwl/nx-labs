import { readJsonFile, workspaceRoot } from '@nx/devkit';
import { execSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';

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
 * Creates a test project with create-nx-workspace and installs the plugin
 * @returns The directory where the test project was created
 */
export function createTestProject(nxVersion: string) {
  const projectName = 'test-project';
  const projectDirectory = join(process.cwd(), 'tmp', projectName);

  // Ensure projectDirectory is empty
  rmSync(projectDirectory, {
    recursive: true,
    force: true,
  });
  mkdirSync(dirname(projectDirectory), {
    recursive: true,
  });

  execSync(
    `npx -y create-nx-workspace@${nxVersion} ${projectName} --preset apps --nxCloud=skip --no-interactive`,
    {
      cwd: dirname(projectDirectory),
      stdio: 'inherit',
      env: process.env,
    }
  );
  console.log(`Created test project in "${projectDirectory}"`);

  return projectDirectory;
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
