import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';
describe('remix e2e', () => {
  it('should create remix', async () => {
    const plugin = uniq('remix');
    ensureNxProject('@remix/remix', 'dist/packages/remix');
    await runNxCommandAsync(`generate @remix/remix:remix ${plugin}`);

    const result = await runNxCommandAsync(`build ${plugin}`);
    expect(result.stdout).toContain('Executor ran');
  }, 120000);

  describe('--directory', () => {
    it('should create src in the specified directory', async () => {
      const plugin = uniq('remix');
      ensureNxProject('@remix/remix', 'dist/packages/remix');
      await runNxCommandAsync(
        `generate @remix/remix:remix ${plugin} --directory subdir`
      );
      expect(() =>
        checkFilesExist(`libs/subdir/${plugin}/src/index.ts`)
      ).not.toThrow();
    }, 120000);
  });

  describe('--tags', () => {
    it('should add tags to the project', async () => {
      const plugin = uniq('remix');
      ensureNxProject('@remix/remix', 'dist/packages/remix');
      await runNxCommandAsync(
        `generate @remix/remix:remix ${plugin} --tags e2etag,e2ePackage`
      );
      const project = readJson(`libs/${plugin}/project.json`);
      expect(project.tags).toEqual(['e2etag', 'e2ePackage']);
    }, 120000);
  });
});
