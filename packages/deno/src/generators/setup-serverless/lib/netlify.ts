import {
  addDependenciesToPackageJson,
  getPackageManagerCommand,
  joinPathFragments,
  ProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { assertNoTarget } from './utils';

export function addNetlifyConfig(
  tree: Tree,
  projectConfig: ProjectConfiguration
) {
  assertNoTarget(projectConfig, 'deploy');
  assertNoTarget(projectConfig, 'serve-functions');

  addTargets(tree, projectConfig);

  const fnDir = joinPathFragments(projectConfig.root, 'functions');
  addEdgeFunction(tree, fnDir);
  addNetlifyToml(tree, fnDir);

  return addDependenciesToPackageJson(
    tree,
    {},
    {
      'netlify-cli': '^13.0.0',
    }
  );
}

function addTargets(tree: Tree, projectConfig: ProjectConfiguration) {
  const pm = getPackageManagerCommand();

  projectConfig.targets.deploy = {
    executor: 'nx:run-commands',
    options: {
      command: `${pm.exec} netlify deploy`,
    },
    configurations: {
      production: {
        command: `${pm.exec} netlify deploy --prod`,
      },
    },
  };
  projectConfig.targets['serve-functions'] = {
    executor: 'nx:run-commands',
    options: {
      command: `${pm.exec} netlify dev`,
    },
  };

  updateProjectConfiguration(tree, projectConfig.name, projectConfig);
}

function addNetlifyToml(tree: Tree, fnDir: string) {
  if (tree.exists('netlify.toml')) {
    // TODO(caleb): merge settings?
    console.warn('netlify.toml already exists, skipping.');
  } else {
    tree.write(
      'netlify.toml',
      `# Netlify Configuration File: https://docs.netlify.com/configure-builds/file-based-configuration
[build]
  # custom directory where edge functions are located.
  # each file in this directory will be considered a separate edge function.
  edge_functions = "${fnDir}"
  publish = "${fnDir}"

[functions]
  # provide all import aliases to netlify
  # https://docs.netlify.com/edge-functions/api/#import-maps
  deno_import_map = "import_map.json"

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

export default async (request: Request, context: Context) => {
  // Here's what's available on context.geo

  // context: {
  //   geo: {
  //     city?: string;
  //     country?: {
  //       code?: string;
  //       name?: string;
  //     },
  //     subdivision?: {
  //       code?: string;
  //       name?: string;
  //     },
  //   }
  // }

  return Response.json({
    geo: context.geo,
    header: request.headers.get('x-nf-geo'),
  });
};
`
  );
}
