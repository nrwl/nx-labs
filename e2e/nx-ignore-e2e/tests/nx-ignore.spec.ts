import { mkdirSync, writeFileSync } from 'fs-extra';
import { join } from 'path';

import {
  ensureNxProject,
  runCommand,
  tmpProjPath,
  uniq,
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

    let result = runCommand(`npx nx-ignore ${proj}`, {});
    expect(result).toMatch(/Build can proceed/);

    runCommand('git commit -m "nothing" --allow-empty', {});
    result = runCommand(`npx nx-ignore ${proj}`, {});
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
});
