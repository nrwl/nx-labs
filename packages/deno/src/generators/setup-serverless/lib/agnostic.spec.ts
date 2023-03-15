import {
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { createDenoAppForTesting } from '../../utils/testing/deno-app';
import { denoSetupServerless } from '../setup-serverless';

describe('setup-serverless --platform=none', () => {
  let tree: Tree;
  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add agnostic config in root project', async () => {
    createDenoAppForTesting(tree, {
      name: 'my-app',
      rootProject: true,
      projectRoot: '.',
      projectName: 'my-app',
      parsedTags: [],
      projectDirectory: 'src',
    });
    await denoSetupServerless(tree, { project: 'my-app', platform: 'none' });

    expect(readProjectConfiguration(tree, 'my-app').targets.deploy)
      .toMatchInlineSnapshot(`
      {
        "executor": "nx:run-commands",
        "options": {
          "command": "echo "TODO configure deploy target"",
        },
      }
    `);
    expect(tree.exists('functions/sample_fn.ts')).toBeTruthy();
    expect(tree.exists('netlify.toml')).toBeFalsy();
  });

  it('should add netlify config in apps-libs layout', async () => {
    createDenoAppForTesting(tree, {
      name: 'my-app',
      projectRoot: 'my-app',
      projectName: 'my-app',
      projectDirectory: 'apps/my-app',
      parsedTags: [],
    });
    await denoSetupServerless(tree, { project: 'my-app', platform: 'none' });

    expect(readProjectConfiguration(tree, 'my-app').targets.deploy)
      .toMatchInlineSnapshot(`
      {
        "executor": "nx:run-commands",
        "options": {
          "command": "echo "TODO configure deploy target"",
        },
      }
    `);
    expect(tree.exists('my-app/functions/sample_fn.ts')).toBeTruthy();
    expect(tree.exists('netlify.toml')).toBeFalsy();
  });
  it('should not overwrite existing deploy target', async () => {
    createDenoAppForTesting(tree, {
      name: 'my-app',
      parsedTags: [],
      projectDirectory: 'src',
      projectName: 'my-app',
      projectRoot: '.',
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
        platform: 'none',
      });
    }).rejects.toThrowErrorMatchingInlineSnapshot(`
      "Project, my-app, already has a deploy target defined.
      Either rename this target or remove it from the project configuration."
    `);
  });
});
