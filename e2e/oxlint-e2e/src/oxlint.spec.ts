import { execSync } from 'child_process';
import {
  cleanupTestProject,
  createTestProject,
  getChildWorkspaceEnv,
  getNxVersion,
  runCommand,
} from './utils';

describe('oxlint plugin', () => {
  let projectDirectory: string;

  beforeAll(() => {
    const nxVersion = getNxVersion();
    projectDirectory = createTestProject(nxVersion);
    // The plugin has been built and published to a local registry in the jest globalSetup
    // Install the plugin built with the latest source code into the test repo
    execSync(`yarn add -D -W @nx/oxlint@e2e`, {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: getChildWorkspaceEnv(),
    });

    execSync('yarn nx add @nx/oxlint --no-interactive', {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: getChildWorkspaceEnv(),
    });

    execSync(
      'yarn nx g @nx/js:lib lib-a --unitTestRunner=none --bundler=none --linter=none --no-interactive',
      {
        cwd: projectDirectory,
        stdio: 'inherit',
        env: getChildWorkspaceEnv(),
      }
    );
  });

  afterAll(() => {
    cleanupTestProject(projectDirectory);
  });

  it('should be installed', () => {
    // npm ls will fail if the package is not installed properly
    execSync('yarn list @nx/oxlint', {
      cwd: projectDirectory,
      stdio: 'inherit',
    });
  });

  it('should register the plugin in nx.json', () => {
    const nxJson = runCommand('cat nx.json', projectDirectory);
    expect(nxJson).toContain('@nx/oxlint/plugin');
  });

  it('should infer an oxlint target for the generated library', () => {
    const projectJson = runCommand(
      'yarn nx show project lib-a --json',
      projectDirectory
    );
    expect(projectJson).toContain('"lint"');
    expect(projectJson).toContain('oxlint lib-a');
  });

  it('should run oxlint successfully', () => {
    execSync('yarn nx run lib-a:lint', {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: getChildWorkspaceEnv(),
    });
  });
});
