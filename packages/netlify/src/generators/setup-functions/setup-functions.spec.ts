import { readProjectConfiguration, stripIndents, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { applicationGenerator } from '@nx/node';
import { setupFunctionsGenerator } from './setup-functions';
describe('setupFunctionsGenerator', () => {
  let tree: Tree;

  beforeEach(() => (tree = createTreeWithEmptyWorkspace()));

  it('should add configuration and functions to existing project', async () => {
    await applicationGenerator(tree, {
      name: 'api',
      framework: 'express',
      e2eTestRunner: 'none',
      docker: false,
    });
    await setupFunctionsGenerator(tree, {
      project: 'api',
    });

    const project = readProjectConfiguration(tree, 'api');
    expect(tree.exists('netlify.toml'));
    expect(project.targets).toEqual(
      expect.objectContaining({
        'serve-functions': {
          command: 'npx netlify dev',
        },
        'deploy-functions': {
          dependsOn: ['lint'],
          command: 'npx netlify deploy',
          options: {
            cwd: 'api',
          },
          configurations: {
            production: {
              command: 'npx netlify deploy --prod',
              cwd: 'api',
            },
          },
        },
      })
    );
  });

  it('should contain functions folder lint pattern', async () => {
    await applicationGenerator(tree, {
      name: 'api',
      framework: 'express',
      rootProject: true,
      docker: false,
    });

    await setupFunctionsGenerator(tree, {
      project: 'api',
    });

    const project = readProjectConfiguration(tree, 'api');

    expect(project.targets.lint.options.lintFilePatterns).toContain(
      './functions/**/*.ts'
    );
  });

  it('should support standalone projects', async () => {
    await applicationGenerator(tree, {
      name: 'api',
      framework: 'express',
      rootProject: true,
      docker: false,
    });

    await setupFunctionsGenerator(tree, {
      project: 'api',
    });

    const project = readProjectConfiguration(tree, 'api');
    expect(tree.exists('netlify.toml'));
    expect(project.targets).toEqual(
      expect.objectContaining({
        'serve-functions': {
          command: 'npx netlify dev',
        },
        'deploy-functions': {
          dependsOn: ['lint'],
          command: 'npx netlify deploy',
          configurations: {
            production: {
              command: 'npx netlify deploy --prod',
            },
          },
        },
      })
    );
  });

  it('should append to existing netlify.toml', async () => {
    await applicationGenerator(tree, {
      name: 'api',
      framework: 'express',
      rootProject: true,
      docker: false,
    });
    tree.write(
      'netlify.toml',
      `[build]\n# existing config\npublish = "dist/api"\n`
    );

    await setupFunctionsGenerator(tree, {
      project: 'api',
    });

    const netlifyToml = tree.read('netlify.toml', 'utf-8');
    expect(netlifyToml).toEqual(stripIndents`
      [build]
      # existing config
      publish = "dist/api"

      [functions]
      # Directory with serverless functions, including background
      # functions, to deploy. This is relative to the base directory
      # if one has been set, or the root directory if
      # a base hasn’t been set.
      directory = "functions/"

      # Specifies \`esbuild\` for functions bundling, esbuild is the default for TS
      # node_bundler = "esbuild"

      [functions."hello*"]
      # Apply settings to any functions with a name beginning with "hello"
    `);
  });
});
