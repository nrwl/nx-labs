import { Tree } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { getRemixConfigPath } from '../../utils/remix-config';
import applicationGenerator from '../application/application.impl';
import routeGenerator from '../route/route.impl';
import metaGenerator from './meta.impl';

describe('meta', () => {
  let tree: Tree;
  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
    tree.write('.gitignore', `/node_modules/dist`);

    await applicationGenerator(tree, { name: 'demo' });
    await routeGenerator(tree, {
      path: 'example',
      project: 'demo',
      style: 'none',
      loader: false,
      action: false,
      meta: false,
      skipChecks: false,
    });
  });

  it('should use v1 when specified', async () => {
    await metaGenerator(tree, {
      path: 'example',
      project: 'demo',
      version: '1',
    });

    const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
    expect(content).toMatch(
      `import type { MetaFunction } from '@remix-run/node';`
    );

    expect(content).toMatch(`export const meta: MetaFunction`);
    expect(content).toMatch(`return {`);
  });

  it('should use v2 when specified', async () => {
    await metaGenerator(tree, {
      path: 'example',
      project: 'demo',
      version: '2',
    });

    const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
    expect(content).toMatch(
      `import type { V2_MetaFunction } from '@remix-run/node';`
    );

    expect(content).toMatch(`export const meta: V2_MetaFunction`);
    expect(content).toMatch(`return [`);
  });

  it('should detect v2_meta future flag when version is not specified', async () => {
    const remixConfigPath = getRemixConfigPath(tree, 'demo');
    let remixConfigContent = tree.read(remixConfigPath, 'utf-8');
    remixConfigContent = remixConfigContent.replace(
      'module.exports = {',
      'module.exports = {\nfuture:{v2_meta: true},\n'
    );
    tree.write(remixConfigPath, remixConfigContent);

    await metaGenerator(tree, {
      path: 'example',
      project: 'demo',
    });

    const content = tree.read('apps/demo/app/routes/example.tsx', 'utf-8');
    expect(content).toMatch(
      `import type { V2_MetaFunction } from '@remix-run/node';`
    );

    expect(content).toMatch(`export const meta: V2_MetaFunction`);
    expect(content).toMatch(`return [`);
  });
});
