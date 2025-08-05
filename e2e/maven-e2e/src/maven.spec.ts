import { execSync } from 'child_process';
import { cleanupTestProject, createTestProject, getNxVersion } from './utils';

describe('maven plugin', () => {
  let projectDirectory: string;

  beforeAll(() => {
    const nxVersion = getNxVersion();
    projectDirectory = createTestProject(nxVersion);
  });

  afterAll(() => {
    cleanupTestProject(projectDirectory);
  });

  it('should have maven init generator', () => {
    // Check that the maven init generator is available
    const output = execSync('yarn nx list @nx/maven', {
      cwd: projectDirectory,
      encoding: 'utf8',
    });
    expect(output).toContain('init');
    execSync('yarn nx generate @nx/maven:init', {
      cwd: projectDirectory,
      stdio: 'inherit',
      env: process.env,
    });
  });

  it('should be installed', () => {
    // npm ls will fail if the package is not installed properly
    execSync('yarn list @nx/maven', {
      cwd: projectDirectory,
      stdio: 'inherit',
    });
  });

  it('should have maven-batch executor', () => {
    // Check that the maven-batch executor is available
    const output = execSync('yarn nx list @nx/maven', {
      cwd: projectDirectory,
      encoding: 'utf8',
    });
    expect(output).toContain('maven-batch');
  });
});
