import { mkdirSync, writeFileSync } from 'fs-extra';
import { join } from 'path';

import {
  ensureNxProject,
  runCommand,
  tmpProjPath,
  uniq,
  updateFile,
} from '@nx/plugin/testing';

describe('nx-ignore e2e', () => {
  let proj: string;
  let projRoot: string;

  beforeEach(() => {
    proj = uniq('proj');
    projRoot = join(tmpProjPath(), proj);
    ensureNxProject('nx-ignore', 'dist/packages/nx-ignore');

    // Add a test project we can make changes to
    mkdirSync(projRoot, { recursive: true });
    writeFileSync(join(projRoot, 'main.ts'), `console.log('hello');\n`);
    writeFileSync(
      join(tmpProjPath(), 'project.json'),
      JSON.stringify(
        {
          name: proj,
        },
        null,
        2
      )
    );
    runCommand(`git init`, {});
    runCommand(`git config user.email "you@example.com"`, {});
    runCommand(`git config user.name "Your Name"`, {});
    runCommand(`git add .`, {});
    runCommand(`git commit -m 'init'`, {});
  });

  it('should deploy if the latest commit touches the project', async () => {
    writeFileSync(join(projRoot, 'main.ts'), `console.log('bye');\n`);
    runCommand('git commit -am "update main"', {});

    let result = runCommand(`npx nx-ignore ${proj} --verbose`, {});
    expect(result).toMatch(/Build can proceed/);

    runCommand('git commit -m "nothing" --allow-empty', {});
    result = runCommand(`npx nx-ignore ${proj} --verbose`, {});
    expect(result).toMatch(/Build cancelled/);
  }, 120_000);

  it('should skip deploy based on commit message', async () => {
    [
      '[ci skip] test',
      '[skip ci] test',
      '[no ci] test',
      '[nx skip] test',
      `[nx skip ${proj}] test`,
    ].forEach((msg) => {
      writeFileSync(join(projRoot, 'main.ts'), `console.log('bye');\n`);
      runCommand(`git commit -am "${msg}"`, {});

      const result = runCommand(`npx nx-ignore ${proj}`, {});
      expect(result).toMatch(/Skip build/);
    });
  }, 120_000);

  it('should force deploy based on commit message', async () => {
    ['[nx deploy] test', `[nx deploy ${proj}] test`].forEach((msg) => {
      runCommand(`git commit -m "${msg}" --allow-empty`, {});

      const result = runCommand(`npx nx-ignore ${proj}`, {});
      expect(result).toMatch(/Forced build/);
    });
  }, 120_000);

  describe('Installation strategies', () => {
    it('should perform a slim installation when Nx plugins are not used', () => {
      runCommand(`git commit -m "test" --allow-empty`, {});

      const result = runCommand(`npx nx-ignore ${proj} --verbose`, {});
      expect(result).toMatch(/slim installation/);
    });

    it('should perform a full installation when Nx plugins are used', () => {
      updateFile('nx.json', (s) => {
        const json = JSON.parse(s);
        json.plugins = ['@nx/jest/plugin'];
        return JSON.stringify(json);
      });
      runCommand(`git commit -m "test" --allow-empty`, {});

      const result = runCommand(`npx nx-ignore ${proj} --verbose`, {});
      expect(result).toMatch(/full installation/);
    });

    it('should perform a slim installation when --slim-install is used', () => {
      updateFile('nx.json', (s) => {
        const json = JSON.parse(s);
        json.plugins = ['@nx/jest/plugin'];
        return JSON.stringify(json);
      });
      runCommand(`git commit -m "test" --allow-empty`, {});

      const result = runCommand(
        `npx nx-ignore ${proj} --slim-install --verbose`,
        {}
      );
      expect(result).toMatch(/slim installation/);
    });

    it('should perform a slim installation when on Netlify', () => {
      // Add plugins and corresponding config files.
      updateFile('nx.json', (s) => {
        const json = JSON.parse(s);
        json.plugins = [
          '@nx/playwright/plugin',
          '@nx/jest/plugin',
          '@nx/next/plugin',
        ];
        return JSON.stringify(json);
      });
      updateFile('package.json', (s) => {
        const json = JSON.parse(s);
        json.dependencies['jest-environment-jsdom'] = '*';
        json.dependencies['jest'] = '*';
        json.dependencies['cypress'] = '*';
        json.dependencies['@playwright/test'] = '*';
        return JSON.stringify(json);
      });
      updateFile(
        `jest.config.ts`,
        `
        import type { Config } from 'jest';
        export const nxPreset: Config = {
          // This is one of the patterns that jest finds by default https://jestjs.io/docs/configuration#testmatch-arraystring
          testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
          resolver: '@nx/jest/plugins/resolver',
          moduleFileExtensions: ['ts', 'js', 'mjs', 'html'],
          coverageReporters: ['html'],
          transform: {
            '^.+\\\\.(ts|js|html)$': [
              'ts-jest',
              { tsconfig: '<rootDir>/tsconfig.spec.json' },
            ],
          },
          testEnvironment: 'jsdom',
          testEnvironmentOptions: {
            customExportConditions: ['node', 'require', 'default'],
          },
        };`
      );
      updateFile(
        `playwright.config.ts`,
        `
        import { defineConfig, devices } from '@playwright/test';
        export default defineConfig({
          testDir: './src',
          outputDir: './dist/.playwright/test-output',
          use: {
            baseURL: 'http://localhost:4200',
            // how long each page.goto can take before timing out
            navigationTimeout: process.env.CI ? 30_000 : undefined,
            /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
            trace: 'on-first-retry',
          },
          webServer: {
            command: 'pnpm exec nx run demo:start',
            url: 'http://localhost:4200',
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
          },
          projects: [
            {
              name: 'chromium',
              use: { ...devices['Desktop Chrome'] },
            },
          ],
        });`
      );
      updateFile(
        'next.config.js',
        `
          // This could be used to determine phases, etc.
          const constants = require('next/constants');
          const { withNx } = require('@nx/next/plugins/with-nx');
          module.exports = withNx({});`
      );

      runCommand(`git commit -m "test" --allow-empty`, {});

      const result = runCommand(`npx nx-ignore ${proj} --verbose`, {
        env: {
          NETLIFY: 'true',
        },
      });
      expect(result).toMatch(/slim installation/);
    });
  });
});
