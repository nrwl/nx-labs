import {
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';
describe('remix e2e', () => {
  it('should create app', async () => {
    const plugin = uniq('remix');
    ensureNxProject('@remix/remix', 'dist/packages/remix');
    await runNxCommandAsync(`generate @remix/remix:app ${plugin}`);

    const result = await runNxCommandAsync(`build ${plugin}`);
    expect(result.stdout).toContain('Successfully ran target build');
  }, 120000);

  describe('--directory', () => {
    it('should create src in the specified directory', async () => {
      const plugin = uniq('remix');
      ensureNxProject('@remix/remix', 'dist/packages/remix');
      await runNxCommandAsync(
        `generate @remix/remix:app ${plugin} --directory subdir`
      );
      const result = await runNxCommandAsync(`build ${plugin}`);
      expect(result.stdout).toContain('Successfully ran target build');
    }, 120000);
  });

  describe('--tags', () => {
    it('should add tags to the project', async () => {
      const plugin = uniq('remix');
      ensureNxProject('@remix/remix', 'dist/packages/remix');
      await runNxCommandAsync(
        `generate @remix/remix:app ${plugin} --tags e2etag,e2ePackage`
      );
      const project = readJson(`apps/${plugin}/project.json`);
      expect(project.tags).toEqual(['e2etag', 'e2ePackage']);
    }, 120000);
  });
});
