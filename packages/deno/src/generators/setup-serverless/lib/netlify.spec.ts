import {
  readJson,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { createDenoAppForTesting } from '../../utils/testing/deno-app';
import { denoSetupServerless } from '../setup-serverless';

describe('setup-serverless --platform=netlify', () => {
  let tree: Tree;
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add netlify config in root project', async () => {
    createDenoAppForTesting(tree, {
      name: 'my-app',
      rootProject: true,
      parsedTags: [],
      projectRoot: '.',
      projectDirectory: 'src',
      projectName: 'my-app',
    });
    await denoSetupServerless(tree, { project: 'my-app', platform: 'netlify' });
    expect(readProjectConfiguration(tree, 'my-app').targets.deploy)
      .toMatchInlineSnapshot(`
      Object {
        "configurations": Object {
          "production": Object {
            "command": "yarn netlify deploy --site=<Your-Netlify-Site-Name>",
          },
        },
        "executor": "nx:run-commands",
        "options": Object {
          "command": "yarn netlify deploy --site=<Your-Netlify-Site-Name>",
        },
      }
    `);
    expect(tree.read('netlify.toml', 'utf-8')).toMatchInlineSnapshot(`
      "# Netlify Configuration File: https://docs.netlify.com/configure-builds/file-based-configuration
      [build]
        # custom directory where edge functions are located.
        # each file in this directory will be considered a separate edge function.
        edge_functions = \\"functions\\"
        publish = \\"functions\\"

      [functions]
        # provide all import aliases to netlify
        # https://docs.netlify.com/edge-functions/api/#import-maps
        deno_import_map = \\"import_map.json\\"

      # Read more about declaring edge functions: 
      # https://docs.netlify.com/edge-functions/declarations/#declare-edge-functions-in-netlify-toml
      [[edge_functions]]
        # this is the name of the file in the edge_functions dir.
        function = \\"hello-geo\\"
        # this is the route that the edge function applies to.
        path = \\"/api/geo\\"
      "
    `);
    expect(tree.exists('functions/hello-geo.ts')).toBeTruthy();
    expect(tree.read('.gitignore', 'utf-8')).toContain('.netlify');
    expect(
      readJson(tree, 'package.json').devDependencies['netlify-cli']
    ).toBeDefined();
  });

  it('should add netlify config in apps-libs layout', async () => {
    createDenoAppForTesting(tree, {
      name: 'my-app',
      parsedTags: [],
      projectRoot: 'apps/my-app',
      projectDirectory: 'apps/my-app/src',
      projectName: 'my-app',
    });
    await denoSetupServerless(tree, { project: 'my-app', platform: 'netlify' });
    expect(readProjectConfiguration(tree, 'my-app').targets.deploy)
      .toMatchInlineSnapshot(`
      Object {
        "configurations": Object {
          "production": Object {
            "command": "yarn netlify deploy --site=<Your-Netlify-Site-Name>",
            "cwd": "apps/my-app",
          },
        },
        "executor": "nx:run-commands",
        "options": Object {
          "command": "yarn netlify deploy --site=<Your-Netlify-Site-Name>",
          "cwd": "apps/my-app",
        },
      }
    `);
    expect(tree.read('apps/my-app/netlify.toml', 'utf-8'))
      .toMatchInlineSnapshot(`
      "# Netlify Configuration File: https://docs.netlify.com/configure-builds/file-based-configuration
      [build]
        # custom directory where edge functions are located.
        # each file in this directory will be considered a separate edge function.
        edge_functions = \\"functions\\"
        publish = \\"functions\\"

      [functions]
        # provide all import aliases to netlify
        # https://docs.netlify.com/edge-functions/api/#import-maps
        deno_import_map = \\"../../import_map.json\\"

      # Read more about declaring edge functions: 
      # https://docs.netlify.com/edge-functions/declarations/#declare-edge-functions-in-netlify-toml
      [[edge_functions]]
        # this is the name of the file in the edge_functions dir.
        function = \\"hello-geo\\"
        # this is the route that the edge function applies to.
        path = \\"/api/geo\\"
      "
    `);
    expect(tree.exists('apps/my-app/functions/hello-geo.ts')).toBeTruthy();
    expect(tree.read('.gitignore', 'utf-8')).toContain('.netlify');
    expect(
      readJson(tree, 'package.json').devDependencies['netlify-cli']
    ).toBeDefined();
  });

  it('should not overwrite existing deploy target', async () => {
    createDenoAppForTesting(tree, {
      name: 'my-app',
      parsedTags: [],
      projectRoot: 'apps/my-app',
      projectDirectory: 'apps/my-app/src',
      projectName: 'my-app',
    });
    const pc = readProjectConfiguration(tree, 'my-app');
    pc.targets.deploy = {
      executor: 'custom:deploy',
      options: {},
    };
    updateProjectConfiguration(tree, 'my-app', pc);
    await expect(async () => {
      await denoSetupServerless(tree, {
        project: 'my-app',
        platform: 'netlify',
      });
    }).rejects.toThrowErrorMatchingInlineSnapshot(`
      "Project, my-app, already has a deploy target defined.
      Either rename this target or remove it from the project configuration."
    `);
  });
});
