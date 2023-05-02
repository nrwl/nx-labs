import {
  ensureNxProject,
  runNxCommand,
  runNxCommandAsync,
  updateFile,
} from '@nrwl/nx-plugin/testing';

describe('Deno Misc Tests', () => {
  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependant on one another.
  beforeAll(() => {
    ensureNxProject('@nrwl/deno', 'dist/packages/deno');
  });

  afterAll(async () => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    await runNxCommandAsync('reset');
  });

  it('should add existing project to deno imports', async () => {
    await runNxCommandAsync('generate @nrwl/deno:app api');
    await runNxCommandAsync('generate @nx/js:lib my-types');
    // change my-types index.ts file to be deno compatible
    updateFile(
      'libs/my-types/src/index.ts',
      `export const myType = () => 'myType';`
    );
    await runNxCommandAsync('generate @nrwl/deno:add-import my-types');
    updateFile(
      'apps/api/src/main.ts',
      `import { myType } from '@proj/my-types';
console.log(myType());`
    );

    expect(() => {
      runNxCommand('serve api --watch=false');
    }).not.toThrow();
  }, 120_000);
});
