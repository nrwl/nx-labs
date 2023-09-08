import { names } from '@nx/devkit';
import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runCommand,
  runNxCommandAsync,
  tmpProjPath,
  uniq,
  updateFile,
} from '@nx/plugin/testing';
import { mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  killPort,
  promisifiedTreeKill,
  runCommandUntil,
  workspaceDirectoryExists,
  workspaceFileExists,
} from './utils';

describe('Deno integrated monorepo', () => {
  const appName = uniq('deno-app');
  const libName = uniq('deno-lib');
  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependant on one another.
  beforeAll(async () => {
    ensureNxProject('@nx/deno', 'dist/packages/deno');
    const nxVersion = readJson('package.json').devDependencies['nx'];
    runCommand(`yarn add -D @nx/js@${nxVersion}`, {});
    // Make sure we have tsconfig.base.json file
    await runNxCommandAsync(`generate @nx/js:init`);
  }, 60_000);

  afterAll(async () => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    await runNxCommandAsync('reset');
  });

  describe('application', () => {
    it('should create deno app', async () => {
      await runNxCommandAsync(`generate @nx/deno:app ${appName}`);
      expect(readJson(`import_map.json`)).toEqual({ imports: {} });
      expect(readJson(`${appName}/deno.json`)).toEqual({
        importMap: '../import_map.json',
      });
      expect(workspaceFileExists(`${appName}/src/main.ts`)).toBeTruthy();
      expect(
        workspaceFileExists(`${appName}/src/handler.test.ts`)
      ).toBeTruthy();
      expect(workspaceFileExists(`${appName}/src/handler.ts`)).toBeTruthy();
    }, 120_000);

    it('should build deno app', async () => {
      const result = await runNxCommandAsync(`build ${appName}`);
      expect(result.stdout).toContain(
        `Successfully ran target build for project ${appName}`
      );
      expect(workspaceFileExists(`dist/${appName}/main.js`)).toBeTruthy();
    }, 120_000);

    it('should build deno app w/assets', async () => {
      // Workspace ignore files
      writeFileSync(join(tmpProjPath(), '.gitignore'), `git-ignore.hbs`);
      writeFileSync(join(tmpProjPath(), '.nxignore'), `nx-ignore.hbs`);

      // Assets
      mkdirSync(join(tmpProjPath(), appName, 'assets/a/b'), {
        recursive: true,
      });
      writeFileSync(join(tmpProjPath(), 'LICENSE'), 'license');
      writeFileSync(join(tmpProjPath(), appName, 'README.md'), 'readme');
      writeFileSync(join(tmpProjPath(), appName, 'assets/test1.hbs'), 'test');
      writeFileSync(join(tmpProjPath(), appName, 'assets/test2.hbs'), 'test');
      writeFileSync(
        join(tmpProjPath(), appName, 'assets/ignore.hbs'),
        'IGNORE ME'
      );
      writeFileSync(
        join(tmpProjPath(), appName, 'assets/git-ignore.hbs'),
        'IGNORE ME'
      );
      writeFileSync(
        join(tmpProjPath(), appName, 'assets/nx-ignore.hbs'),
        'IGNORE ME'
      );
      writeFileSync(
        join(tmpProjPath(), appName, 'assets/a/b/nested-ignore.hbs'),
        'IGNORE ME'
      );

      const project = readJson(`${appName}/project.json`);
      project.targets.build.options.assets = [
        `${appName}/*.md`,
        {
          input: `${appName}/assets`,
          glob: '**/*.hbs',
          output: 'assets',
          ignore: ['ignore.hbs', '**/nested-ignore.hbs'],
        },
        'LICENSE',
      ];
      updateFile(`${appName}/project.json`, JSON.stringify(project));

      const result = await runNxCommandAsync(`build ${appName}`);
      expect(result.stdout).toContain(
        `Successfully ran target build for project ${appName}`
      );
      expect(() =>
        checkFilesExist(
          `dist/${appName}/main.js`,
          `dist/${appName}/LICENSE`,
          `dist/${appName}/README.md`,
          `dist/${appName}/assets/test1.hbs`,
          `dist/${appName}/assets/test2.hbs`
        )
      ).not.toThrow();
      expect(
        workspaceFileExists(`dist/${appName}/assets/ignore.hbs`)
      ).toBeFalsy();
      expect(
        workspaceFileExists(`dist/${appName}/assets/git-ignore.hbs`)
      ).toBeFalsy();
      expect(
        workspaceFileExists(`dist/${appName}/assets/nx-ignore.hbs`)
      ).toBeFalsy();
      expect(
        workspaceFileExists(`dist/${appName}/assets/a/b/nested-ignore.hbs`)
      ).toBeFalsy();
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
      const badTestFilePath = join(
        tmpProjPath(),
        appName,
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

    // TODO(caleb): why is this failing only in CI?
    xit('should lint deno app w/options', async () => {
      const badFilePath = join(tmpProjPath(), appName, 'src', 'lint.ts');
      writeFileSync(
        badFilePath,
        `async function blah() {
const a = 1;
console.log('123');
}`
      );

      await expect(async () => {
        await runNxCommandAsync(`lint ${appName} --skip-nx-cache`);
      }).rejects.toThrow();

      const result = await runNxCommandAsync(
        `lint ${appName} --rules-exclude=require-await,no-unused-vars`
      );
      expect(result.stdout).toContain(
        `Successfully ran target lint for project ${appName}`
      );

      updateFile(`${appName}/deno.json`, (contents) => {
        const config = JSON.parse(contents);
        const newConfig = {
          ...config,
          lint: {
            files: {
              exclude: ['src/lint.ts'],
            },
          },
        };

        return JSON.stringify(newConfig, null, 2);
      });
      const excludeResult = await runNxCommandAsync(`lint ${appName} --quiet`);
      expect(excludeResult.stdout).toContain(
        `Successfully ran target lint for project ${appName}`
      );

      unlinkSync(badFilePath);
    }, 120_000);

    describe('--directory', () => {
      const nestedAppName = uniq('deno-app');
      it('should create app in the specified directory', async () => {
        await runNxCommandAsync(
          `generate @nx/deno:app ${nestedAppName} --directory nested`
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
        `generate @nx/deno:app ${appName}-tagged --tags scope:deno,type:app`
      );
      const project = readJson(`${appName}-tagged/project.json`);
      expect(project.tags).toEqual(['scope:deno', 'type:app']);
    }, 120_000);
  });

  describe('library', () => {
    it('should create deno lib', async () => {
      await runNxCommandAsync(`generate @nx/deno:lib ${libName}`);
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

    it('should create deno lib with node entrypoint', async () => {
      const withNode = `${libName}-with-node`;
      // create js lib to ensure tsconfig is setup
      await runNxCommandAsync(
        `generate @nx/js:lib ${uniq('js-lib')} --no-interactive`
      );
      checkFilesExist('tsconfig.base.json');

      await runNxCommandAsync(`generate @nx/deno:lib ${withNode} --node`);
      expect(readJson(`import_map.json`).imports).toEqual(
        expect.objectContaining({
          [`@proj/${withNode}`]: `./${withNode}/mod.ts`,
        })
      );
      expect(readJson(`${withNode}/deno.json`)).toEqual({
        importMap: '../import_map.json',
      });
      expect(workspaceFileExists(`${withNode}/mod.ts`)).toBeTruthy();
      expect(
        workspaceFileExists(`${withNode}/src/${withNode}.test.ts`)
      ).toBeTruthy();
      expect(
        workspaceFileExists(`${withNode}/src/${withNode}.ts`)
      ).toBeTruthy();
      expect(workspaceFileExists(`${withNode}/node.ts`)).toBeTruthy();
      expect(readJson('tsconfig.base.json').compilerOptions.paths).toEqual(
        expect.objectContaining({
          [`@proj/${withNode}`]: [`${withNode}/node.ts`],
        })
      );
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

    // TODO(caleb): why does this only fail in CI?
    xit('should lint deno lib w/options', async () => {
      const badFilePath = join(tmpProjPath(), libName, 'src', 'lint.ts');
      writeFileSync(
        badFilePath,
        `async function blah() {
const a = 1;
console.log('123');
}`
      );

      await expect(async () => {
        await runNxCommandAsync(`lint ${libName} --skip-nx-cache`);
      }).rejects.toThrow();

      const result = await runNxCommandAsync(
        `lint ${libName} --rules-exclude=require-await,no-unused-vars`
      );
      expect(result.stdout).toContain(
        `Successfully ran target lint for project ${libName}`
      );

      updateFile(`${libName}/deno.json`, (contents) => {
        const config = JSON.parse(contents);
        const newConfig = {
          ...config,
          lint: {
            files: {
              exclude: ['src/lib/lint.ts'],
            },
          },
        };

        return JSON.stringify(newConfig, null, 2);
      });
      const excludeResult = await runNxCommandAsync(`lint ${libName} --quiet`);
      expect(excludeResult.stdout).toContain(
        `Successfully ran target lint for project ${libName}`
      );

      unlinkSync(badFilePath);
    }, 120_000);

    describe('--directory', () => {
      const nestedLibName = uniq('deno-lib');
      it('should create lib in the specified directory', async () => {
        await runNxCommandAsync(
          `generate @nx/deno:lib ${nestedLibName} --directory nested`
        );
        expect(readJson(`import_map.json`).imports).toEqual(
          expect.objectContaining({
            [`@proj/${libName}`]: `./${libName}/mod.ts`,
            [`@proj/nested-${nestedLibName}`]: `./nested/${nestedLibName}/mod.ts`,
          })
        );
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
        `generate @nx/deno:lib ${libName}-tagged --tags scope:deno,type:lib`
      );
      const project = readJson(`${libName}-tagged/project.json`);
      expect(project.tags).toEqual(['scope:deno', 'type:lib']);
    }, 120_000);

    it('should be able to use import alias of lib in app', async () => {
      const fnName = names(libName).propertyName;
      updateFile(
        `${appName}/src/main.ts`,
        `import { ${fnName} } from '@proj/${libName}'

console.log(${fnName}())`
      );

      const p = await runCommandUntil(`serve ${appName}`, (output) => {
        return output.includes(libName);
      });
      await promisifiedTreeKill(p.pid, 'SIGKILL');
    }, 120_000);

    it('should be able to use import alias of lib in app for build', async () => {
      const fnName = names(libName).propertyName;
      updateFile(
        `${appName}/src/main.ts`,
        `import { ${fnName} } from '@proj/${libName}'

console.log(${fnName}())`
      );

      const result = await runNxCommandAsync(`build ${appName}`);
      expect(result.stdout).toContain(
        `Successfully ran target build for project ${appName}`
      );
      expect(workspaceFileExists(`dist/${appName}/main.js`)).toBeTruthy();
    }, 120_000);
  });

  describe('--bundler deno_emit', () => {
    const bundlerAppName = uniq('deno-app-deno-emit');
    const bundlerLibName = uniq('deno-lib-deno-emit');

    it('should create deno app', async () => {
      await runNxCommandAsync(
        `generate @nx/deno:app ${bundlerAppName} --bundler deno_emit`
      );
      expect(workspaceFileExists(`${bundlerAppName}/src/main.ts`)).toBeTruthy();
    }, 120_000);

    it('should build deno app', async () => {
      const result = await runNxCommandAsync(`build ${bundlerAppName}`);
      expect(result.stdout).toContain(
        `Successfully ran target build for project ${bundlerAppName}`
      );
      expect(
        workspaceFileExists(`dist/${bundlerAppName}/main.js`)
      ).toBeTruthy();
    }, 120_000);

    it('should build deno app w/assets', async () => {
      // Workspace ignore files
      writeFileSync(join(tmpProjPath(), '.gitignore'), `git-ignore.hbs`);
      writeFileSync(join(tmpProjPath(), '.nxignore'), `nx-ignore.hbs`);

      // Assets
      mkdirSync(join(tmpProjPath(), bundlerAppName, 'assets/a/b'), {
        recursive: true,
      });
      writeFileSync(join(tmpProjPath(), 'LICENSE'), 'license');
      writeFileSync(join(tmpProjPath(), bundlerAppName, 'README.md'), 'readme');
      writeFileSync(
        join(tmpProjPath(), bundlerAppName, 'assets/test1.hbs'),
        'test'
      );
      writeFileSync(
        join(tmpProjPath(), bundlerAppName, 'assets/test2.hbs'),
        'test'
      );
      writeFileSync(
        join(tmpProjPath(), bundlerAppName, 'assets/ignore.hbs'),
        'IGNORE ME'
      );
      writeFileSync(
        join(tmpProjPath(), bundlerAppName, 'assets/git-ignore.hbs'),
        'IGNORE ME'
      );
      writeFileSync(
        join(tmpProjPath(), bundlerAppName, 'assets/nx-ignore.hbs'),
        'IGNORE ME'
      );
      writeFileSync(
        join(tmpProjPath(), bundlerAppName, 'assets/a/b/nested-ignore.hbs'),
        'IGNORE ME'
      );

      const project = readJson(`${bundlerAppName}/project.json`);
      project.targets.build.options.assets = [
        `${bundlerAppName}/*.md`,
        {
          input: `${bundlerAppName}/assets`,
          glob: '**/*.hbs',
          output: 'assets',
          ignore: ['ignore.hbs', '**/nested-ignore.hbs'],
        },
        'LICENSE',
      ];
      updateFile(`${bundlerAppName}/project.json`, JSON.stringify(project));

      const result = await runNxCommandAsync(`build ${bundlerAppName}`);
      expect(result.stdout).toContain(
        `Successfully ran target build for project ${bundlerAppName}`
      );
      expect(() =>
        checkFilesExist(
          `dist/${bundlerAppName}/main.js`,
          `dist/${bundlerAppName}/LICENSE`,
          `dist/${bundlerAppName}/README.md`,
          `dist/${bundlerAppName}/assets/test1.hbs`,
          `dist/${bundlerAppName}/assets/test2.hbs`
        )
      ).not.toThrow();
      expect(
        workspaceFileExists(`dist/${bundlerAppName}/assets/ignore.hbs`)
      ).toBeFalsy();
      expect(
        workspaceFileExists(`dist/${bundlerAppName}/assets/git-ignore.hbs`)
      ).toBeFalsy();
      expect(
        workspaceFileExists(`dist/${bundlerAppName}/assets/nx-ignore.hbs`)
      ).toBeFalsy();
      expect(
        workspaceFileExists(
          `dist/${bundlerAppName}/assets/a/b/nested-ignore.hbs`
        )
      ).toBeFalsy();
    }, 120_000);

    it('should create deno lib', async () => {
      await runNxCommandAsync(`generate @nx/deno:lib ${bundlerLibName}`);
      expect(readJson(`import_map.json`).imports).toEqual(
        expect.objectContaining({
          [`@proj/${bundlerLibName}`]: `./${bundlerLibName}/mod.ts`,
        })
      );
      expect(workspaceFileExists(`${bundlerLibName}/mod.ts`)).toBeTruthy();
      expect(
        workspaceFileExists(`${bundlerLibName}/src/${bundlerLibName}.test.ts`)
      ).toBeTruthy();
      expect(
        workspaceFileExists(`${bundlerLibName}/src/${bundlerLibName}.ts`)
      ).toBeTruthy();
    }, 120_000);

    it('should be able to use import alias of lib in app for build', async () => {
      const fnName = names(bundlerLibName).propertyName;
      updateFile(
        `${bundlerAppName}/src/main.ts`,
        `import { ${fnName} } from '@proj/${bundlerLibName}'

console.log(${fnName}())`
      );

      const result = await runNxCommandAsync(`build ${bundlerAppName}`);
      expect(result.stdout).toContain(
        `Successfully ran target build for project ${bundlerAppName}`
      );
      expect(
        workspaceFileExists(`dist/${bundlerAppName}/main.js`)
      ).toBeTruthy();
    }, 120_000);
  });

  describe('--bundler esbuild', () => {
    const bundlerAppName = uniq('deno-app-esbuild');
    const bundlerLibName = uniq('deno-lib-esbuild');

    it('should create deno app', async () => {
      await runNxCommandAsync(
        `generate @nx/deno:app ${bundlerAppName} --bundler esbuild`
      );
      expect(workspaceFileExists(`${bundlerAppName}/src/main.ts`)).toBeTruthy();
    }, 120_000);

    it('should build deno app', async () => {
      const result = await runNxCommandAsync(`build ${bundlerAppName}`);
      expect(result.stdout).toContain(
        `Successfully ran target build for project ${bundlerAppName}`
      );
      expect(
        workspaceFileExists(`dist/${bundlerAppName}/main.js`)
      ).toBeTruthy();
    }, 120_000);

    it('should build deno app w/assets', async () => {
      // Workspace ignore files
      writeFileSync(join(tmpProjPath(), '.gitignore'), `git-ignore.hbs`);
      writeFileSync(join(tmpProjPath(), '.nxignore'), `nx-ignore.hbs`);

      // Assets
      mkdirSync(join(tmpProjPath(), bundlerAppName, 'assets/a/b'), {
        recursive: true,
      });
      writeFileSync(join(tmpProjPath(), 'LICENSE'), 'license');
      writeFileSync(join(tmpProjPath(), bundlerAppName, 'README.md'), 'readme');
      writeFileSync(
        join(tmpProjPath(), bundlerAppName, 'assets/test1.hbs'),
        'test'
      );
      writeFileSync(
        join(tmpProjPath(), bundlerAppName, 'assets/test2.hbs'),
        'test'
      );
      writeFileSync(
        join(tmpProjPath(), bundlerAppName, 'assets/ignore.hbs'),
        'IGNORE ME'
      );
      writeFileSync(
        join(tmpProjPath(), bundlerAppName, 'assets/git-ignore.hbs'),
        'IGNORE ME'
      );
      writeFileSync(
        join(tmpProjPath(), bundlerAppName, 'assets/nx-ignore.hbs'),
        'IGNORE ME'
      );
      writeFileSync(
        join(
          tmpProjPath(),
          bundlerAppName,
          'assets/a/b/nested-ignore.hbs'
        ),
        'IGNORE ME'
      );

      const project = readJson(`${bundlerAppName}/project.json`);
      project.targets.build.options.assets = [
        `${bundlerAppName}/*.md`,
        {
          input: `${bundlerAppName}/assets`,
          glob: '**/*.hbs',
          output: 'assets',
          ignore: ['ignore.hbs', '**/nested-ignore.hbs'],
        },
        'LICENSE',
      ];
      updateFile(
        `${bundlerAppName}/project.json`,
        JSON.stringify(project)
      );

      const result = await runNxCommandAsync(`build ${bundlerAppName}`);
      expect(result.stdout).toContain(
        `Successfully ran target build for project ${bundlerAppName}`
      );
      expect(() =>
        checkFilesExist(
          `dist/${bundlerAppName}/main.js`,
          `dist/${bundlerAppName}/LICENSE`,
          `dist/${bundlerAppName}/README.md`,
          `dist/${bundlerAppName}/assets/test1.hbs`,
          `dist/${bundlerAppName}/assets/test2.hbs`
        )
      ).not.toThrow();
      expect(
        workspaceFileExists(`dist/${bundlerAppName}/assets/ignore.hbs`)
      ).toBeFalsy();
      expect(
        workspaceFileExists(`dist/${bundlerAppName}/assets/git-ignore.hbs`)
      ).toBeFalsy();
      expect(
        workspaceFileExists(`dist/${bundlerAppName}/assets/nx-ignore.hbs`)
      ).toBeFalsy();
      expect(
        workspaceFileExists(
          `dist/${bundlerAppName}/assets/a/b/nested-ignore.hbs`
        )
      ).toBeFalsy();
    }, 120_000);

    it('should create deno lib', async () => {
      await runNxCommandAsync(`generate @nx/deno:lib ${bundlerLibName}`);
      expect(readJson(`import_map.json`).imports).toEqual(
        expect.objectContaining({
          [`@proj/${bundlerLibName}`]: `./${bundlerLibName}/mod.ts`,
        })
      );
      expect(workspaceFileExists(`${bundlerLibName}/mod.ts`)).toBeTruthy();
      expect(
        workspaceFileExists(
          `${bundlerLibName}/src/${bundlerLibName}.test.ts`
        )
      ).toBeTruthy();
      expect(
        workspaceFileExists(`${bundlerLibName}/src/${bundlerLibName}.ts`)
      ).toBeTruthy();
    }, 120_000);

    it('should be able to use import alias of lib in app for build', async () => {
      const fnName = names(bundlerLibName).propertyName;
      updateFile(
        `${bundlerAppName}/src/main.ts`,
        `import { ${fnName} } from '@proj/${bundlerLibName}'

console.log(${fnName}())`
      );

      const result = await runNxCommandAsync(`build ${bundlerAppName}`);
      expect(result.stdout).toContain(
        `Successfully ran target build for project ${bundlerAppName}`
      );
      expect(
        workspaceFileExists(`dist/${bundlerAppName}/main.js`)
      ).toBeTruthy();
    }, 120_000);
  });
});
