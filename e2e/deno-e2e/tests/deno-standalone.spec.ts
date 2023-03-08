import { names } from '@nrwl/devkit';
import {
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  tmpProjPath,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing';
import { unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  killPort,
  promisifiedTreeKill,
  runCommandUntil,
  workspaceDirectoryExists,
  workspaceFileExists,
} from './utils';

describe('Deno standalone app', () => {
  const appName = uniq('deno-app');
  const libName = uniq('deno-lib');
  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependant on one another.
  beforeAll(() => {
    ensureNxProject('@nrwl/deno', 'dist/packages/deno');
  });

  afterAll(() => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    runNxCommandAsync('reset');
  });

  describe('application', () => {
    it('should create deno app', async () => {
      await runNxCommandAsync(`generate @nrwl/deno:preset ${appName}`);
      expect(readJson(`import_map.json`)).toEqual({ imports: {} });
      expect(readJson(`deno.json`)).toEqual({
        importMap: 'import_map.json',
      });
      expect(workspaceFileExists(`src/main.ts`)).toBeTruthy();
      expect(workspaceFileExists(`src/handler.test.ts`)).toBeTruthy();
      expect(workspaceFileExists(`src/handler.ts`)).toBeTruthy();
    }, 120_000);

    it('should build deno app', async () => {
      const result = await runNxCommandAsync(`build ${appName}`);
      expect(result.stdout).toContain(
        `Successfully ran target build for project ${appName}`
      );
      expect(workspaceFileExists(`dist/${appName}/main.js`)).toBeTruthy();
    }, 120_000);

    it('should serve deno app', async () => {
      const p = await runCommandUntil(`serve ${appName}`, (output) => {
        return output.includes(`Listening on`);
      });
      await promisifiedTreeKill(p.pid, 'SIGKILL');
      await killPort(8000);
    }, 120_000);

    it('should test deno app', async () => {
      const result = await runNxCommandAsync(`test ${appName}`);
      expect(result.stdout).toContain(
        `Successfully ran target test for project ${appName}`
      );
      expect(workspaceDirectoryExists(`coverage/${appName}`)).toBeTruthy();
    }, 120_000);
    it('should test deno app w/options', async () => {
      const badTestFilePath = join(tmpProjPath(), 'src', 'file.test.ts');
      writeFileSync(
        badTestFilePath,
        `import { assertEquals } from 'https://deno.land/std@0.172.0/testing/asserts.ts';

Deno.test('Another File', async () => {
  const num: string = 1;
  assertEquals(Deno.env.get('DENO_JOBS'), '2');
});
`
      );
      const result = await runNxCommandAsync(
        `test ${appName} -p=2 --check=none`
      );
      expect(result.stdout).toContain(
        `Successfully ran target test for project ${appName}`
      );
      expect(workspaceDirectoryExists(`coverage/${appName}`)).toBeTruthy();
      await expect(async () => {
        await runNxCommandAsync(`test ${appName} -p=2`);
      }).rejects.toThrow();
      unlinkSync(badTestFilePath);
    }, 120_000);

    it('should lint deno app', async () => {
      const result = await runNxCommandAsync(`lint ${appName}`);
      expect(result.stdout).toContain(
        `Successfully ran target lint for project ${appName}`
      );
    }, 120_000);

    describe('--directory', () => {
      const nestedAppName = uniq('deno-app');
      it('should create app in the specified directory', async () => {
        await runNxCommandAsync(
          `generate @nrwl/deno:app ${nestedAppName} --directory nested`
        );
        expect(
          workspaceFileExists(`nested/${nestedAppName}/src/main.ts`)
        ).toBeTruthy();
      }, 120_000);
      it('should build deno app', async () => {
        const result = await runNxCommandAsync(`build nested-${nestedAppName}`);
        expect(result.stdout).toContain(
          `Successfully ran target build for project nested-${nestedAppName}`
        );
        expect(
          workspaceFileExists(`dist/nested/${nestedAppName}/main.js`)
        ).toBeTruthy();
      }, 120_000);

      it('should serve deno app', async () => {
        const p = await runCommandUntil(
          `serve nested-${nestedAppName}`,
          (output) => {
            return output.includes(`Listening on`);
          }
        );
        await promisifiedTreeKill(p.pid, 'SIGKILL');
        await killPort(8000);
      }, 120_000);

      it('should test deno app', async () => {
        const result = await runNxCommandAsync(`test nested-${nestedAppName}`);
        expect(result.stdout).toContain(
          `Successfully ran target test for project nested-${nestedAppName}`
        );
        expect(
          workspaceDirectoryExists(`coverage/nested/${nestedAppName}`)
        ).toBeTruthy();
      }, 120_000);

      it('should lint deno app', async () => {
        const result = await runNxCommandAsync(`lint nested-${nestedAppName}`);
        expect(result.stdout).toContain(
          `Successfully ran target lint for project nested-${nestedAppName}`
        );
      }, 120_000);
    });

    it('should add tags to app project', async () => {
      await runNxCommandAsync(
        `generate @nrwl/deno:app ${appName}-tagged --tags scope:deno,type:app`
      );
      const project = readJson(`${appName}-tagged/project.json`);
      expect(project.tags).toEqual(['scope:deno', 'type:app']);
    }, 120_000);
  });

  describe('library', () => {
    it('should create deno lib', async () => {
      await runNxCommandAsync(`generate @nrwl/deno:lib ${libName}`);
      expect(readJson(`import_map.json`)).toEqual({
        imports: {
          [`@proj/${libName}`]: `./${libName}/mod.ts`,
        },
      });
      expect(readJson(`${libName}/deno.json`)).toEqual({
        importMap: '../import_map.json',
      });
      expect(workspaceFileExists(`${libName}/mod.ts`)).toBeTruthy();
      expect(
        workspaceFileExists(`${libName}/src/${libName}.test.ts`)
      ).toBeTruthy();
      expect(workspaceFileExists(`${libName}/src/${libName}.ts`)).toBeTruthy();
    }, 120_000);

    it('should test deno lib', async () => {
      const result = await runNxCommandAsync(`test ${libName}`);
      expect(result.stdout).toContain(
        `Successfully ran target test for project ${libName}`
      );
      expect(workspaceDirectoryExists(`coverage/${libName}`)).toBeTruthy();
    }, 120_000);

    it('should test deno lib w/options', async () => {
      const badTestFilePath = join(
        tmpProjPath(),
        libName,
        'src',
        'file.test.ts'
      );
      writeFileSync(
        badTestFilePath,
        `import { assertEquals } from 'https://deno.land/std@0.172.0/testing/asserts.ts';

Deno.test('Another File', async () => {
  const num: string = 1;
  assertEquals(Deno.env.get('DENO_JOBS'), '2');
});
`
      );
      const result = await runNxCommandAsync(
        `test ${libName} -p=2 --check=none`
      );
      expect(result.stdout).toContain(
        `Successfully ran target test for project ${libName}`
      );
      expect(workspaceDirectoryExists(`coverage/${libName}`)).toBeTruthy();
      await expect(async () => {
        await runNxCommandAsync(`test ${libName} -p=2`);
      }).rejects.toThrow();
      unlinkSync(badTestFilePath);
    }, 120_000);

    it('should lint deno lib', async () => {
      const result = await runNxCommandAsync(`lint ${libName}`);
      expect(result.stdout).toContain(
        `Successfully ran target lint for project ${libName}`
      );
    }, 120_000);

    describe('--directory', () => {
      const nestedLibName = uniq('deno-lib');
      it('should create lib in the specified directory', async () => {
        await runNxCommandAsync(
          `generate @nrwl/deno:lib ${nestedLibName} --directory nested`
        );
        expect(readJson(`import_map.json`)).toEqual({
          imports: {
            [`@proj/${libName}`]: `./${libName}/mod.ts`,
            [`@proj/nested-${nestedLibName}`]: `./nested/${nestedLibName}/mod.ts`,
          },
        });
        expect(
          workspaceFileExists(`nested/${nestedLibName}/mod.ts`)
        ).toBeTruthy();
        expect(
          workspaceFileExists(
            `nested/${nestedLibName}/src/${nestedLibName}.test.ts`
          )
        ).toBeTruthy();
        expect(
          workspaceFileExists(`nested/${nestedLibName}/src/${nestedLibName}.ts`)
        ).toBeTruthy();
      }, 120_000);

      it('should test deno lib', async () => {
        const result = await runNxCommandAsync(`test nested-${nestedLibName}`);
        expect(result.stdout).toContain(
          `Successfully ran target test for project nested-${nestedLibName}`
        );
        expect(
          workspaceDirectoryExists(`coverage/nested/${nestedLibName}`)
        ).toBeTruthy();
      }, 120_000);
      it('should lint deno lib', async () => {
        const result = await runNxCommandAsync(`lint nested-${nestedLibName}`);
        expect(result.stdout).toContain(
          `Successfully ran target lint for project nested-${nestedLibName}`
        );
      }, 120_000);
    });
    it('should add tags to lib project', async () => {
      await runNxCommandAsync(
        `generate @nrwl/deno:lib ${libName}-tagged --tags scope:deno,type:lib`
      );
      const project = readJson(`${libName}-tagged/project.json`);
      expect(project.tags).toEqual(['scope:deno', 'type:lib']);
    }, 120_000);

    it('should be able to use import alias of lib in app', async () => {
      const fnName = names(libName).propertyName;
      updateFile(
        `src/main.ts`,
        `import { ${fnName} } from '@proj/${libName}'

console.log(${fnName}())`
      );

      const p = await runCommandUntil(`serve ${appName}`, (output) => {
        return output.includes(libName);
      });
      await promisifiedTreeKill(p.pid, 'SIGKILL');
    }, 120_000);
  });
});
