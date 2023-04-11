import {Tree} from '@nrwl/devkit';
import {createTreeWithEmptyWorkspace} from '@nrwl/devkit/testing';
import applicationGenerator from '../application/application.impl';
import routeGenerator from '../route/route.impl';
import styleGenerator from './style.impl';

describe('route', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({layout: 'apps-libs'});
    tree.write('.gitignore', `/node_modules/dist`);
  });

  it('should add css file to shared styles directory', async () => {
    await applicationGenerator(tree, {name: 'demo'});
    await routeGenerator(tree, {
      project: 'demo',
      path: 'path/to/example',
      style: 'none',
      loader: false,
      action: false,
      meta: false,
      skipChecks: false
    });
    await styleGenerator(tree, {
      project: 'demo',
      path: 'path/to/example'
    })

    expect(
      tree.exists('apps/demo/app/styles/path/to/example.css')
    ).toBeTruthy();
  });

  it('should handle routes that have a param', async () => {
    await applicationGenerator(tree, {name: 'demo'});
    await routeGenerator(tree, {
      project: 'demo',
      path: '/example/$withParam.tsx',
      style: 'none',
      loader: false,
      action: false,
      meta: false,
      skipChecks: false
    });
    await styleGenerator(tree, {
      project: 'demo',
      path: '/example/$withParam.tsx',
    })

    expect(
      tree.exists('apps/demo/app/styles/example/$withParam.css')
    ).toBeTruthy();
  });


});
