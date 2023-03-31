import {
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { createDenoAppForTesting } from '../../utils/testing/deno-app';
import { denoSetupServerless } from '../setup-serverless';

describe('setup-serverless --platform=deno-deploy', () => {
  let tree: Tree;
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add deploy target to root project', async () => {
    createDenoAppForTesting(tree, {
      name: 'my-app',
      rootProject: true,
      projectRoot: '.',
      projectName: 'my-app',
      parsedTags: [],
      projectDirectory: 'src',
    });
    tree.write('src/main.ts', 'console.log("Hello World")');
    await denoSetupServerless(tree, {
      project: 'my-app',
      platform: 'deno-deploy',
    });

    expect(readProjectConfiguration(tree, 'my-app').targets.deploy)
      .toMatchInlineSnapshot(`
      Object {
        "configurations": Object {
          "preview": Object {
            "command": "deployctl deploy --project=<Your-Deno-Deploy-Project-Name> --import-map=import_map.json --exclude=node_modules src/main.ts",
          },
          "production": Object {
            "command": "deployctl deploy --project=<Your-Deno-Deploy-Project-Name> --import-map=import_map.json --exclude=node_modules --prod src/main.ts",
          },
        },
        "executor": "nx:run-commands",
        "options": Object {
          "command": "deployctl deploy --project=<Your-Deno-Deploy-Project-Name> --import-map=import_map.json --exclude=node_modules  src/main.ts --dry-run",
        },
      }
    `);
  });

  it('should add deploy target to integrated project', async () => {
    createDenoAppForTesting(tree, {
      name: 'my-app',
      rootProject: false,
      projectRoot: 'apps/my-app',
      projectName: 'my-app',
      parsedTags: [],
      projectDirectory: 'apps/my-app/src',
    });
    await denoSetupServerless(tree, {
      project: 'my-app',
      platform: 'deno-deploy',
    });
    expect(readProjectConfiguration(tree, 'my-app').targets.deploy)
      .toMatchInlineSnapshot(`
      Object {
        "configurations": Object {
          "preview": Object {
            "command": "deployctl deploy --project=<Your-Deno-Deploy-Project-Name> --import-map=import_map.json --exclude=node_modules <Your-Entrypoint-file>",
          },
          "production": Object {
            "command": "deployctl deploy --project=<Your-Deno-Deploy-Project-Name> --import-map=import_map.json --exclude=node_modules --prod <Your-Entrypoint-file>",
          },
        },
        "executor": "nx:run-commands",
        "options": Object {
          "command": "deployctl deploy --project=<Your-Deno-Deploy-Project-Name> --import-map=import_map.json --exclude=node_modules  <Your-Entrypoint-file> --dry-run",
        },
      }
    `);
  });

  it('should not overwrite existing  deploy target', async () => {
    createDenoAppForTesting(tree, {
      name: 'my-app',
      rootProject: true,
      projectRoot: '.',
      projectName: 'my-app',
      parsedTags: [],
      projectDirectory: 'src',
    });
    const pc = readProjectConfiguration(tree, 'my-app');
    pc.targets.deploy = {
      executor: 'custom:executor',
    };
    updateProjectConfiguration(tree, 'my-app', pc);

    await expect(async () => {
      await denoSetupServerless(tree, {
        project: 'my-app',
        platform: 'deno-deploy',
      });
    }).rejects.toThrowErrorMatchingInlineSnapshot(`
      "Project, my-app, already has a deploy target defined.
      Either rename this target or remove it from the project configuration."
    `);
  });
});
