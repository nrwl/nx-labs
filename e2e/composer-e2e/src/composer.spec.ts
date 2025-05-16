import { execSync } from 'child_process';
import { cleanupTestProject, createTestProject, getNxVersion } from './utils';

// TODO: Add tests that actually invoke composer and php, but we need to make sure agents are set up correctly.
// For now we're checking most things manually.
describe('composer', () => {
  let projectDirectory: string;

  beforeAll(() => {
    const nxVersion = getNxVersion();
    projectDirectory = createTestProject(nxVersion);
    // The plugin has been built and published to a local registry in the jest globalSetup
    // Install the plugin built with the latest source code into the test repo
    execSync(`yarn add -D -W @nx/composer@e2e`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  });

  afterAll(() => {
    cleanupTestProject(projectDirectory);
  });

  it('should be installed', () => {
    // npm ls will fail if the package is not installed properly
    execSync('yarn list @nx/composer', {
      cwd: projectDirectory,
      stdio: 'inherit',
    });
  });
});
