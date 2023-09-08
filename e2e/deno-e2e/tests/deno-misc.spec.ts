import {
  ensureNxProject,
  runNxCommand,
  runNxCommandAsync,
  updateFile,
} from '@nx/plugin/testing';

describe('Deno Misc Tests', () => {
  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependant on one another.
  beforeAll(() => {
    ensureNxProject('@nx/deno', 'dist/packages/deno');
  });

  afterAll(async () => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    await runNxCommandAsync('reset');
  });

  it('should add existing project to deno imports', async () => {
    await runNxCommandAsync('generate @nx/js:lib my-types');
    await runNxCommandAsync('generate @nx/deno:app api');
    // change my-types index.ts file to be deno compatible
    updateFile(
      'my-types/src/index.ts',
      `export const myType = () => 'myType';`
    );
    await runNxCommandAsync('generate @nx/deno:add-import my-types');
    updateFile(
      'api/src/main.ts',
      `import { myType } from '@proj/my-types';
console.log(myType());`
    );

    expect(() => {
      runNxCommand('serve api --watch=false');
    }).not.toThrow();
  }, 120_000);
});
