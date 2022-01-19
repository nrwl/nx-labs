import { runNxCommandAsync, uniq, updateFile } from '@nrwl/nx-plugin/testing';

describe('Expo', () => {
  let proj: string;

  it('should create files and run lint command', async () => {
    const appName = uniq('my-app');
    const libName = uniq('lib');
    const componentName = uniq('component');

    await runNxCommandAsync(`generate @nrwl/expo:application ${appName}`);
    await runNxCommandAsync(`generate @nrwl/expo:library ${libName}`);
    await runNxCommandAsync(
      `generate @nrwl/expo:component ${componentName} --project=${libName} --export`
    );

    updateFile(`apps/${appName}/src/app/App.tsx`, (content) => {
      let updated = `import ${componentName} from '${proj}/${libName}';\n${content}`;
      return updated;
    });

    // testing does not work due to issue https://github.com/callstack/react-native-testing-library/issues/743
    // react-native 0.64.3 is using @jest/create-cache-key-function 26.5.0 that is incompatible with jest 27.
    // expectTestsPass(await runCLIAsync(`test ${appName}`));
    // expectTestsPass(await runCLIAsync(`test ${libName}`));

    const appLintResults = await runNxCommandAsync(`lint ${appName}`);
    expect(appLintResults.stdout).toContain('All files pass linting.');
    const libLintResults = await runNxCommandAsync(`lint ${libName}`);
    expect(libLintResults.stdout).toContain('All files pass linting.');
  });
});
