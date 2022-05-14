import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import loaderGenerator from './loader.impl';
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
    await loaderGenerator(tree, {
      file: 'apps/demo/app/routes/example.tsx',
    });
  });

  it('should add imports', async () => {
    const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
    expect(content).toMatch(
      `import type { LoaderFunction } from '@remix-run/node';`
    );
  });

  it('should add loader function', () => {
    const actionFunctionType = `type ExampleLoaderData`;
    const actionFunction = ` export const loader: LoaderFunction = async`;
    const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
    expect(content).toMatch(actionFunctionType);
    expect(content).toMatch(actionFunction);
  });

  it('should add useActionData to component', () => {
    const useActionData = `const data = useLoaderData<ExampleLoaderData>();`;

    const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
    expect(content).toMatch(useActionData);
  });
});
