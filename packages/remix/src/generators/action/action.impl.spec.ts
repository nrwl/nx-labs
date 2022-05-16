import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import actionGenerator from './action.impl';
import applicationGenerator from '../application/application.impl';
import routeGenerator from '../route/route.impl';

describe('action', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace();
    tree.write('.gitignore', `/node_modules/dist`);

    await applicationGenerator(tree, { name: 'demo' });
    await routeGenerator(tree, {
      path: 'example',
      project: 'demo',
      style: 'none',
      loader: false,
      action: false,
      meta: false,
    });
  });

  [
    {
      path: 'apps/demo/app/routes/example.tsx',
    },
    {
      path: 'example',
    },
    {
      path: 'example.tsx',
    },
  ].forEach((config) => {
    describe(`Generating action using path ${config.path}`, () => {
      beforeEach(async () => {
        await actionGenerator(tree, {
          path: config.path,
          // path: 'apps/demo/app/routes/example.tsx',
          project: 'demo',
        });
      });
      it('should add imports', async () => {
        const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
        expect(content).toMatch(
          `import type { ActionFunction } from '@remix-run/node';`
        );
      });

      it('should add action function', () => {
        const actionFunction = `
    type ExampleActionData = {
        message: string;
    };
    
    export let action: ActionFunction = async ({ request }) => {
      let formData = await request.formData();
  
      return json({message: formData.toString()}, { status: 200 });
    };
    `;
        const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
        expect(content).toMatch(actionFunction);
      });

      it('should add useActionData to component', () => {
        const useActionData = `export default function Example() {
const actionMessage = useActionData<ExampleActionData>();
return (<p>Example works!</p>)
}`;

        const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
        expect(content).toMatch(useActionData);
      });
    });
  });
});
