import { readJsonFile, workspaceRoot } from '@nx/devkit';
import { execSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';

export function getStrippedEnvironmentVariables() {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => {
      if (key.startsWith('NX_E2E_')) {
        return true;
      }

      const allowedKeys = [
        'NX_ADD_PLUGINS',
        'NX_ISOLATE_PLUGINS',
        'NX_VERBOSE_LOGGING',
        'NX_NATIVE_LOGGING',
        'NX_USE_LOCAL',
      ];

      if (key.startsWith('NX_') && !allowedKeys.includes(key)) {
        return false;
      }

      if (key === 'JEST_WORKER_ID') {
        return false;
      }

      if (key === 'NODE_PATH') {
        return false;
      }

      return true;
    })
  );
}

export function getChildWorkspaceEnv() {
  return {
    CI: 'true',
    NX_NO_CLOUD: 'true',
    NX_INTERNAL_USE_LEGACY_VERSIONING: 'false',
    ...getStrippedEnvironmentVariables(),
  };
}

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
      env: getChildWorkspaceEnv(),
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

export function runCommand(command: string, cwd: string): string {
  return execSync(command, {
    cwd,
    stdio: 'pipe',
    env: getChildWorkspaceEnv(),
    encoding: 'utf-8',
  });
}
