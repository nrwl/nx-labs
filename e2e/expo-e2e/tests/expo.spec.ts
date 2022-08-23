import {
  expectTestsPass,
  runNxCommandAsync,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing';

describe('Expo', () => {
  let proj: string;

  it('should create files and run test, lint and build-web command', async () => {
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

    expectTestsPass(await runNxCommandAsync(`test ${appName}`));
    expectTestsPass(await runNxCommandAsync(`test ${libName}`));

    const appLintResults = await runNxCommandAsync(`lint ${appName}`);
    expect(appLintResults.stdout).toContain('All files pass linting.');
    const libLintResults = await runNxCommandAsync(`lint ${libName}`);
    expect(libLintResults.stdout).toContain('All files pass linting.');

    const buildWebResults = await runNxCommandAsync(`build-web  ${appName}`);
    expect(buildWebResults.stdout).toContain('Web Bundling complete');
  });
});
