import {
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import appGenerator from '../application/application';
import deployGenerator from './setup-deploy';

describe('Setup Deno Deploy Generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add deploy target', async () => {
    await appGenerator(tree, { name: 'my-app' });
    await deployGenerator(tree, { project: 'my-app' });

    const project = readProjectConfiguration(tree, 'my-app');

    expect(project.targets.deploy).toEqual({
      executor: 'nx:run-commands',
      options: {
        command:
          'deployctl deploy --project=<Your-Deno-Deploy-Project-Name> --import-map=import_map.json --exclude=node_modules  my-app/src/main.ts --dry-run',
      },
      configurations: {
        preview: {
          command:
            'deployctl deploy --project=<Your-Deno-Deploy-Project-Name> --import-map=import_map.json --exclude=node_modules my-app/src/main.ts',
        },
        production: {
          command:
            'deployctl deploy --project=<Your-Deno-Deploy-Project-Name> --import-map=import_map.json --exclude=node_modules --prod my-app/src/main.ts',
        },
      },
    });
  });

  it('should guard against conflicting deploy target', async () => {
    await appGenerator(tree, { name: 'my-app' });
    const project = readProjectConfiguration(tree, 'my-app');
    project.targets.deploy = {
      command: 'echo deploy',
    };
    updateProjectConfiguration(tree, 'my-app', project);

    await expect(deployGenerator(tree, { project: 'my-app' })).rejects.toThrow(
      /already has a deploy target defined/
    );
  });
});
