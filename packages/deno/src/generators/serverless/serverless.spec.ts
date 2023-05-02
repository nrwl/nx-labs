import { readJson, readProjectConfiguration, Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { denoServerlessGenerator } from './serverless';

describe('serverless generator', () => {
  let tree: Tree;

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should setup netlify project', async () => {
    await denoServerlessGenerator(tree, {
      platform: 'netlify',
      name: 'my-netlify-app',
    });

    expect(readProjectConfiguration(tree, 'my-netlify-app')).toMatchSnapshot();
    expect(readJson(tree, 'my-netlify-app/deno.json')).toEqual({
      importMap: '../import_map.json',
    });

    expect(tree.read('my-netlify-app/netlify.toml', 'utf-8'))
      .toMatchInlineSnapshot(`
      "# Netlify Configuration File: https://docs.netlify.com/configure-builds/file-based-configuration
      [build]
        # custom directory where edge functions are located.
        # each file in this directory will be considered a separate edge function.
        edge_functions = \\"src\\"
        publish = \\"src\\"

      [functions]
        # provide all import aliases to netlify
        # https://docs.netlify.com/edge-functions/api/#import-maps
        deno_import_map = \\"../import_map.json\\"

      # Read more about declaring edge functions:
      # https://docs.netlify.com/edge-functions/declarations/#declare-edge-functions-in-netlify-toml
      [[edge_functions]]
        # this is the name of the file in the src.
        function = \\"main\\"
        # this is the route that the edge function applies to.
        path = \\"/\\"

      "
    `);
    expect(tree.exists('my-netlify-app/functions')).toBeFalsy();
    expect(tree.read('my-netlify-app/src/main.ts', 'utf-8'))
      .toMatchInlineSnapshot(`
      "/**
       * Netlify Edge Function overview:
       * https://docs.netlify.com/edge-functions/overview/
       **/

      import type { Context } from 'https://edge.netlify.com/';

      export default async function handler(req: Request, context: Context) {
        const content = \`<html>
        <body>
          <h1>Hello my-netlify-app 👋</h1>
        </body>
      </html>\`;

        return new Response(content, {
          status: 200,
          headers: { 'Content-Type': 'text/html;charset=utf-8' },
        });
      }
      "
    `);
  });

  it('should setup deno-deploy project', async () => {
    await denoServerlessGenerator(tree, {
      platform: 'deno-deploy',
      name: 'my-deno-deploy-app',
    });

    expect(
      readProjectConfiguration(tree, 'my-deno-deploy-app')
    ).toMatchSnapshot();
    expect(readJson(tree, 'my-deno-deploy-app/deno.json')).toEqual({
      importMap: '../import_map.json',
    });

    expect(tree.exists('my-deno-deploy-app/netlify.toml')).toBeFalsy();
    expect(tree.exists('my-deno-deploy-app/functions')).toBeFalsy();
    expect(tree.read('my-deno-deploy-app/src/main.ts', 'utf-8'))
      .toMatchInlineSnapshot(`
      "import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';

      const port = Number(Deno.env.get('PORT') || 4200);

      const handler = (request: Request): Response => {
        // https://deno.com/deploy/docs/projects#environment-variables
        const region = Deno.env.get('DENO_REGION') || 'localhost';

        const body = \`<html>
        <body>
          <h1>Viewing my-deno-deploy-app from \${region} 👋</h1>
        </body>
      </html>\`;

        return new Response(body, {
          status: 200,
          headers: {
            'Content-Type': 'text/html;charset=utf-8',
          },
        });
      };

      console.log(\`HTTP webserver running. Access it at: http://localhost:\${port}/\`);
      await serve(handler, { port });
      "
    `);
  });

  it('should setup empty project', async () => {
    await denoServerlessGenerator(tree, {
      platform: 'none',
      name: 'my-plain-app',
    });

    expect(readProjectConfiguration(tree, 'my-plain-app')).toMatchSnapshot();
    expect(readJson(tree, 'my-plain-app/deno.json')).toEqual({
      importMap: '../import_map.json',
    });

    expect(tree.exists('my-plain-app/netlify.toml')).toBeFalsy();
    expect(tree.exists('my-plain-app/functions')).toBeFalsy();
    expect(tree.read('my-plain-app/src/main.ts', 'utf-8'))
      .toMatchInlineSnapshot(`
      "console.log('Hello my-plain-app');
      // TODO: Write awesome code 💻
      "
    `);
  });

  it('should setup in --directory', async () => {
    await denoServerlessGenerator(tree, {
      platform: 'none',
      name: 'my-plain-app',
      directory: 'nested',
    });

    expect(
      readProjectConfiguration(tree, 'nested-my-plain-app')
    ).toMatchSnapshot();
    expect(readJson(tree, 'nested/my-plain-app/deno.json')).toEqual({
      importMap: '../../import_map.json',
    });

    expect(tree.exists('nested/my-plain-app/netlify.toml')).toBeFalsy();
    expect(tree.exists('nested/my-plain-app/functions')).toBeFalsy();
    expect(tree.read('nested/my-plain-app/src/main.ts', 'utf-8'))
      .toMatchInlineSnapshot(`
      "console.log('Hello nested-my-plain-app');
      // TODO: Write awesome code 💻
      "
    `);
  });
});
