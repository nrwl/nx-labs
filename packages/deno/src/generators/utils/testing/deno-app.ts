import { addProjectConfiguration, joinPathFragments, Tree } from '@nx/devkit';
import type { DenoAppNormalizedSchema } from '../../application/schema';

export function createDenoAppForTesting(
  tree: Tree,
  opts: DenoAppNormalizedSchema
) {
  addProjectConfiguration(tree, opts.name, {
    name: opts.name,
    root: opts.projectRoot,
    targets: {
      build: {
        executor: '@nx/deno:emit',
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
        executor: '@nx/deno:run',
        options: {
          buildTarget: `${opts.projectName}:build`,
        },
      },
      test: {
        executor: '@nx/deno:test',
        options: {
          coverageDirectory: joinPathFragments('coverage', opts.projectRoot),
          denoConfig: joinPathFragments(opts.projectRoot, 'deno.json'),
        },
      },
      lint: {
        executor: '@nx/deno:lint',
        options: {
          denoConfig: joinPathFragments(opts.projectRoot, 'deno.json'),
        },
      },
    },
  });
}
