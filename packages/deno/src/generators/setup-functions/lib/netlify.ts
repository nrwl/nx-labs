import {
  addDependenciesToPackageJson,
  getPackageManagerCommand,
  joinPathFragments,
  offsetFromRoot,
  ProjectConfiguration,
  readProjectConfiguration,
  stripIndents,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { relative } from 'path';
import { DenoSetupServerlessSchema } from '../schema';
import { assertNoTarget } from './utils';

export function addNetlifyConfig(tree: Tree, opts: DenoSetupServerlessSchema) {
  const projectConfig = readProjectConfiguration(tree, opts.project);
  assertNoTarget(projectConfig, opts.serveTarget);
  assertNoTarget(projectConfig, opts.deployTarget);

  addTargets(tree, projectConfig, opts);

  const fnDir = joinPathFragments(projectConfig.root, 'functions');
  addEdgeFunction(tree, fnDir);
  addIndexHtml(tree, opts);
  addNetlifyToml(tree, projectConfig, fnDir);

  return addDependenciesToPackageJson(
    tree,
    {},
    {
      'netlify-cli': '^13.0.0',
    }
  );
}

function addTargets(
  tree: Tree,
  projectConfig: ProjectConfiguration,
  opts: DenoSetupServerlessSchema
) {
  const pm = getPackageManagerCommand();
  const cwd =
    projectConfig.root === '.' || projectConfig.root === ''
      ? undefined
      : projectConfig.root;

  let siteArg = ' --site=<Your-Netlify-Site-Name>';
  if (opts.site) {
    siteArg = ` --site=${opts.site}`;
  }

  projectConfig.targets[opts.deployTarget] = {
    executor: 'nx:run-commands',
    options: {
      command: `${pm.exec} netlify deploy${
        projectConfig.root === '.' ? '' : siteArg
      }`,
      cwd,
    },
    configurations: {
      production: {
        command: `${pm.exec} netlify deploy --prod${
          projectConfig.root === '.' ? '' : siteArg
        }`,
        cwd,
      },
    },
  };
  projectConfig.targets[opts.serveTarget] = {
    executor: 'nx:run-commands',
    options: {
      command: `${pm.exec} netlify dev`,
      cwd,
    },
  };

  updateProjectConfiguration(tree, projectConfig.name, projectConfig);
}

function addNetlifyToml(
  tree: Tree,
  projectConfig: ProjectConfiguration,
  fnDir: string
) {
  const publicDir = 'public';
  const fromProjectRootFnDir = relative(projectConfig.root, fnDir);
  const netlifyPath = joinPathFragments(projectConfig.root, 'netlify.toml');
  const offset = offsetFromRoot(projectConfig.root);

  const buildContent = tree.exists(netlifyPath)
    ? tree.read(netlifyPath, 'utf-8')
    : `
# Netlify Configuration File: https://docs.netlify.com/configure-builds/file-based-configuration
[build]
  # custom directory where edge functions are located.
  # each file in this directory will be considered a separate edge function.
  edge_functions = "${fromProjectRootFnDir}"
  publish = "${publicDir}"

`;
  const fnsContent = `
[functions]
  # provide all import aliases to netlify
  # https://docs.netlify.com/edge-functions/api/#import-maps
  deno_import_map = "${offset === './' ? '' : offset}import_map.json"

# Read more about declaring edge functions:
# https://docs.netlify.com/edge-functions/declarations/#declare-edge-functions-in-netlify-toml
[[edge_functions]]
  # this is the name of the file in the edge_functions dir.
  function = "hello-geo"
  # this is the route that the edge function applies to.
  path = "/api/geo"
`;

  tree.write(netlifyPath, `${buildContent}\n${fnsContent}`);

  const gitignore = tree.read('.gitignore', 'utf-8');
  if (!gitignore?.includes('.netlify')) {
    tree.write('.gitignore', `${gitignore}\n# Local Netlify folder\n.netlify`);
  }
}

function addEdgeFunction(tree: Tree, fnDir: string) {
  tree.write(
    joinPathFragments(fnDir, 'hello-geo.ts'),
    `/**
* Netlify Edge Function overview:
* https://docs.netlify.com/edge-functions/overview/
**/

import { Context } from 'https://edge.netlify.com';

export default (request: Request, context: Context) => {
  return Response.json({
    geo: context.geo,
    header: request.headers.get('x-nf-geo'),
  });
};
`
  );
}

function addIndexHtml(tree: Tree, opts: DenoSetupServerlessSchema) {
  const project = readProjectConfiguration(tree, opts.project);
  const indexHtml = joinPathFragments(project.root, 'public/index.html');
  if (!tree.exists(indexHtml)) {
    tree.write(
      indexHtml,
      stripIndents`
        <h1>Netlify Functions</h1>
        <p>The sample function is available at <a href="/api/geo"><code>/api/geo</code></a>.</p>
      `
    );
  }
}
