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
    await actionGenerator(tree, {
      file: 'apps/demo/app/routes/example.tsx',
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
