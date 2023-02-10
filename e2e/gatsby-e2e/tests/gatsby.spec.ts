import {
  checkFilesExist,
  ensureNxProject,
  expectTestsPass,
  runNxCommand,
  runNxCommandAsync,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing';
// TODO: fix and enable this when gatsby plugin is updated
describe.skip('Gatsby Applications', () => {
  it('should generate a valid gatsby application', async () => {
    ensureNxProject('@nrwl/gatsby', 'dist/packages/gatsby');
    const appName = uniq('app');
    runNxCommand(
      `generate @nrwl/gatsby:app ${appName} --style css --no-interactive`
    );
    runNxCommand(
      `generate @nrwl/gatsby:component header --project ${appName} --style css --no-interactive`
    );

    checkFilesExist(
      `apps/${appName}/package.json`,
      `apps/${appName}/src/components/header.tsx`,
      `apps/${appName}/src/components/header.spec.tsx`,
      `apps/${appName}/src/pages/index.tsx`,
      `apps/${appName}/src/pages/index.spec.tsx`
    );

    updateFile(
      `apps/${appName}/src/pages/index.tsx`,
      `
        import Header from '../components/header';
        export default function Index() {
          return (
            <>
              <Header/>
              <p>Welcome ${appName}</p>
            </>
          );
        }
      `
    );

    runNxCommand(`build ${appName}`);
    checkFilesExist(
      `apps/${appName}/public/index.html`,
      `apps/${appName}/public/404.html`,
      `apps/${appName}/public/manifest.webmanifest`
    );

    const result = runNxCommand(`lint ${appName}`);
    expect(result).toContain('All files pass linting.');

    expectTestsPass(await runNxCommandAsync(`test ${appName}`));
  }, 600000);
});
