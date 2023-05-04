import {
  addDependenciesToPackageJson,
  getPackageManagerCommand,
  joinPathFragments,
  offsetFromRoot,
  ProjectConfiguration,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { relative } from 'path';
import { DenoSetupServerlessSchema } from '../schema';
import { assertNoTarget } from './utils';

export function addNetlifyConfig(tree: Tree, opts: DenoSetupServerlessSchema) {
  const projectConfig = readProjectConfiguration(tree, opts.project);
  assertNoTarget(projectConfig, 'deploy');
  assertNoTarget(projectConfig, 'serve-functions');

  addTargets(tree, projectConfig, opts.site);

  const fnDir = joinPathFragments(projectConfig.root, 'functions');
  addEdgeFunction(tree, fnDir);
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
  siteName?: string
) {
  const pm = getPackageManagerCommand();
  const cwd =
    projectConfig.root === '.' || projectConfig.root === ''
      ? undefined
      : projectConfig.root;

  let siteArg = '--site=<Your-Netlify-Site-Name>';
  if (siteName) {
    siteArg = `--site=${siteName}`;
  }

  projectConfig.targets.deploy = {
    executor: 'nx:run-commands',
    options: {
      command: `${pm.exec} netlify deploy ${siteArg}`,
      cwd,
    },
    configurations: {
      production: {
        command: `${pm.exec} netlify deploy ${siteArg}`,
        cwd,
      },
    },
  };
  projectConfig.targets['serve-functions'] = {
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
  const fromProjectRootFnDir = relative(projectConfig.root, fnDir);
  const netlifyPath = joinPathFragments(projectConfig.root, 'netlify.toml');
  const offset = offsetFromRoot(projectConfig.root);

  if (!tree.exists(netlifyPath)) {
    tree.write(
      netlifyPath,
      `# Netlify Configuration File: https://docs.netlify.com/configure-builds/file-based-configuration
[build]
  # custom directory where edge functions are located.
  # each file in this directory will be considered a separate edge function.
  edge_functions = "${fromProjectRootFnDir}"
  publish = "${fromProjectRootFnDir}"

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
`
    );
  }

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
