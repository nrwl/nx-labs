import { readJson, Tree, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import setupGenerator from './setup.impl';

describe('app', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write(
      '.gitignore',
      `/node_modules
  /dist`
    );
  });

  it('should setup npm workspace', async () => {
    await setupGenerator(tree, {
      packageManager: 'npm',
    });

    const content = readJson(tree, 'package.json');
    expect(content).toMatchObject({
      workspaces: ['libs/*'],
    });
  });

  it('should setup yarn workspace', async () => {
    await setupGenerator(tree, {
      packageManager: 'yarn',
    });

    const content = readJson(tree, 'package.json');
    expect(content).toMatchObject({
      workspaces: ['libs/*'],
    });
  });

  it('should setup pnpm workspace', async () => {
    await setupGenerator(tree, {
      packageManager: 'pnpm',
    });

    const content = tree.read('pnpm-workspace.yaml').toString();
    expect(content).toEqual(`packages:
  - 'libs/*'`);
  });

  it('should update ignore file', async () => {
    // Idempotency
    await setupGenerator(tree, {});
    await setupGenerator(tree, {});

    const ignoreFile = tree.read('.gitignore').toString();
    expect(ignoreFile).toEqual(`node_modules
  dist
  # Remix files
  apps/**/build
  apps/**/.cache
  `);
  });

  it('should add dev dependency on build tasks', async () => {
    await setupGenerator(tree, {});

    let nxJson = readJson(tree, 'nx.json');

    expect(nxJson.targetDependencies).toEqual({
      dev: [{ projects: 'dependencies', target: 'build' }],
    });

    // Existing entries
    updateJson(tree, 'nx.json', (json) => {
      json.targetDependencies = {
        build: [{ projects: 'dependencies', target: 'build' }],
      };
      return json;
    });
    await setupGenerator(tree, {});

    nxJson = readJson(tree, 'nx.json');

    expect(nxJson.targetDependencies).toEqual({
      build: [{ projects: 'dependencies', target: 'build' }],
      dev: [{ projects: 'dependencies', target: 'build' }],
    });

    // Existing dev entry
    updateJson(tree, 'nx.json', (json) => {
      json.targetDependencies = {
        dev: [{ projects: 'self', target: 'pre-dev' }],
      };
      return json;
    });
    await setupGenerator(tree, {});

    nxJson = readJson(tree, 'nx.json');

    expect(nxJson.targetDependencies).toEqual({
      dev: [
        { projects: 'self', target: 'pre-dev' },
        { projects: 'dependencies', target: 'build' },
      ],
    });
  });
});
