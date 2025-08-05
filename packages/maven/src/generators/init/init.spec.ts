import { Tree, formatFiles, readJson, readNxJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { initGenerator } from './init';
import { InitGeneratorSchema } from './schema';

describe('init generator', () => {
  let tree: Tree;
  const options: InitGeneratorSchema = {};

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add @nx/maven dependency to package.json', async () => {
    tree.write('package.json', JSON.stringify({ dependencies: {} }));

    await initGenerator(tree, options);

    const packageJson = readJson(tree, 'package.json');
    expect(packageJson.devDependencies['@nx/maven']).toBeDefined();
  });

  it('should add Maven plugin to nx.json', async () => {
    await initGenerator(tree, options);

    const nxJson = readNxJson(tree);
    expect(nxJson.plugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          plugin: '@nx/maven',
          options: {
            mavenExecutable: 'mvn',
          },
        }),
      ])
    );
  });

  it('should add Maven named inputs to nx.json', async () => {
    await initGenerator(tree, options);

    const nxJson = readNxJson(tree);
    expect(nxJson.namedInputs.maven).toEqual([
      '{projectRoot}/pom.xml',
      '{projectRoot}/src/**/*',
      '{workspaceRoot}/pom.xml',
    ]);
  });

  it('should add Maven target defaults to nx.json', async () => {
    await initGenerator(tree, options);

    const nxJson = readNxJson(tree);
    expect(nxJson.targetDefaults.compile).toBeDefined();
    expect(nxJson.targetDefaults.test).toBeDefined();
    expect(nxJson.targetDefaults.package).toBeDefined();
  });

  it('should skip package.json updates when skipPackageJson is true', async () => {
    tree.write('package.json', JSON.stringify({ dependencies: {} }));

    await initGenerator(tree, { skipPackageJson: true });

    const packageJson = readJson(tree, 'package.json');
    expect(packageJson.devDependencies?.['@nx/maven']).toBeUndefined();
  });

  it('should use custom Maven executable', async () => {
    const customOptions: InitGeneratorSchema = {
      mavenExecutable: './mvnw',
    };

    await initGenerator(tree, customOptions);

    const nxJson = readNxJson(tree);
    expect(nxJson.plugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          plugin: '@nx/maven',
          options: {
            mavenExecutable: './mvnw',
          },
        }),
      ])
    );
  });

  it('should not add plugin twice', async () => {
    // First run
    await initGenerator(tree, options);

    // Second run
    await initGenerator(tree, options);

    const nxJson = readNxJson(tree);
    const mavenPlugins = nxJson.plugins.filter(
      (plugin: any) => plugin.plugin === '@nx/maven' || plugin === '@nx/maven'
    );
    expect(mavenPlugins).toHaveLength(1);
  });

  it('should skip formatting when skipFormat is true', async () => {
    const formatSpy = jest.spyOn({ formatFiles }, 'formatFiles');

    await initGenerator(tree, { skipFormat: true });

    expect(formatSpy).not.toHaveBeenCalled();
  });
});
