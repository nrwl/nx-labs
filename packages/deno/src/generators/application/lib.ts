import {
  addProjectConfiguration,
  generateFiles,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  offsetFromRoot,
  output,
  ProjectConfiguration,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nrwl/devkit';
import { join } from 'path';
import { DenoAppGeneratorSchema, DenoAppNormalizedSchema } from './schema';

export function normalizeOptions(
  tree: Tree,
  options: DenoAppGeneratorSchema
): DenoAppNormalizedSchema {
  // --monorepo takes precedence over --rootProject
  // This is for running `create-nx-workspace --preset=@nrwl/deno --monorepo`
  const rootProject = !options.monorepo && options.rootProject;

  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const appDir = getWorkspaceLayout(tree).appsDir;
  // prevent paths from being dist/./app-name
  const projectRoot = rootProject
    ? '.'
    : joinPathFragments(appDir === '.' ? '' : appDir, projectDirectory);
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  options.platform ??= 'none';
  options.framework ??= 'none';

  return {
    ...options,
    rootProject,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

export function addFiles(tree: Tree, options: DenoAppNormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    importMapPath: joinPathFragments(
      offsetFromRoot(options.projectRoot),
      'import_map.json'
    ),
    template: '',
  };
  generateFiles(
    tree,
    join(__dirname, 'files', 'root-files'),
    options.projectRoot,
    templateOptions
  );

  generateFiles(
    tree,
    join(__dirname, 'files', `framework-${options.framework}`),
    join(options.projectRoot, 'src'),
    templateOptions
  );
}

export function addProjectConfig(tree: Tree, opts: DenoAppNormalizedSchema) {
  const coverageDirectory = joinPathFragments(
    'coverage',
    opts.rootProject ? opts.name : opts.projectRoot
  );
  const targets: ProjectConfiguration['targets'] = {
    build: {
      executor: '@nrwl/deno:bundle',
      outputs: [
        joinPathFragments(
          'dist',
          opts.rootProject ? opts.name : opts.projectRoot
        ),
      ],
      options: {
        main: joinPathFragments(opts.projectRoot, 'src/main.ts'),
        outputFile: joinPathFragments(
          'dist',
          opts.rootProject ? opts.name : opts.projectRoot,
          'main.js'
        ),
        denoConfig: joinPathFragments(opts.projectRoot, 'deno.json'),
      },
    },
    serve: {
      executor: '@nrwl/deno:run',
      options: {
        buildTarget: `${opts.projectName}:build`,
      },
    },
    test: {
      executor: '@nrwl/deno:test',
      outputs: [coverageDirectory],
      options: {
        coverageDirectory,
        denoConfig: joinPathFragments(opts.projectRoot, 'deno.json'),
      },
    },
    lint: {
      executor: '@nrwl/deno:lint',
      options: {
        denoConfig: joinPathFragments(opts.projectRoot, 'deno.json'),
      },
    },
  };

  if (opts.withWatch === true) {
    targets.serve.options.watch = true;
  }

  if (opts.linter === 'none') {
    delete targets.lint;
  }

  if (opts.unitTestRunner === 'none') {
    delete targets.test;
  }

  addProjectConfiguration(tree, opts.projectName, {
    root: opts.projectRoot,
    projectType: 'application',
    name: opts.projectName,
    sourceRoot: joinPathFragments(opts.projectRoot, 'src'),
    targets,
    tags: opts.parsedTags,
  });
}

export function applyNetlifyAppConfig(
  tree: Tree,
  opts: DenoAppNormalizedSchema
) {
  // since the entire app is a netlify edge_function
  // we just need to run netlify dev instead of @nrwl/deno:run
  const projectConfig = readProjectConfiguration(tree, opts.projectName);

  projectConfig.targets.serve = projectConfig.targets['serve-functions'];
  // serve-functions comes from the @nrwl/deno:setup-serverless
  // which should be already called by this point
  delete projectConfig.targets['serve-functions'];
  updateProjectConfiguration(tree, opts.projectName, projectConfig);

  const srcDir = joinPathFragments(opts.projectRoot, 'src');
  tree.delete(srcDir);

  // delete the default hello-geo function from @nrwl/deno:setup-serverless
  const defaultGeoFn = joinPathFragments(
    opts.projectRoot,
    'functions',
    'hello-geo.ts'
  );
  if (tree.exists(defaultGeoFn)) {
    tree.delete(defaultGeoFn);
  }

  if (tree.exists('netlify.toml')) {
    const netlifyToml = tree.read('netlify.toml', 'utf-8');
    let updatedConfig = netlifyToml;
    if (updatedConfig.includes('edge_functions')) {
      updatedConfig = updatedConfig.replace(
        /edge_functions = "(.*)"/,
        `edge_functions = "${srcDir}"`
      );
      updatedConfig = updatedConfig.replace(
        /publish = "(.*)"/,
        `publish = "${srcDir}"`
      );
    } else {
      output.note({
        title: 'Next Steps: edge_functions',
        bodyLines: [
          `Unable to find and update the 'edge_functions' property in your netlify.toml file.`,
          `Please add the following to your netlify.toml file:`,
          `\t[build]`,
          `\t\tedge_functions = "${srcDir}"`,
        ],
      });
    }

    // remove auto generated hello-geo fn since we delete it
    if (updatedConfig.includes('hello-geo')) {
      updatedConfig = updatedConfig
        .replace('hello-geo', `app`)
        .replace('/api/geo', '/');
    }

    if (!updatedConfig.includes('function = "app"')) {
      updatedConfig = `${updatedConfig}
[[edge_functions]]
  # this is the name of the file in the ${srcDir}.
  function = "app"
  # this is the route that the edge function applies to.
  path = "/"
`;
    }

    tree.write('netlify.toml', updatedConfig);
  } else {
    tree.write(
      'netlify.toml',
      `# Netlify Configuration File: https://docs.netlify.com/configure-builds/file-based-configuration
[build]
  # custom directory where edge functions are located.
  # each file in this directory will be considered a separate edge function.
  edge_functions = "${srcDir}"
  publish = "${srcDir}"

[functions]
  # provide all import aliases to netlify
  # https://docs.netlify.com/edge-functions/api/#import-maps
  deno_import_map = "import_map.json"

# Read more about declaring edge functions: 
# https://docs.netlify.com/edge-functions/declarations/#declare-edge-functions-in-netlify-toml
[[edge_functions]]
  # this is the name of the file in the ${srcDir}.
  function = "app"
  # this is the route that the edge function applies to.
  path = "/"
`
    );
  }

  tree.write(
    `${srcDir}/app.ts`,
    `/**
* Netlify Edge Function overview: 
* https://docs.netlify.com/edge-functions/overview/
**/

import type { Config, Context } from 'https://edge.netlify.com/'

export default async function handler(req: Request, context: Context) {
const content = \`<html>
  <body>
    <h1>Hello ${opts.projectName} 👋</h1>
  </body>
</html>\`;

 return new Response(content, {
    status: 200,
    headers: { 'Content-Type': 'text/html;charset=utf-8' },
  });
};
`
  );
}
