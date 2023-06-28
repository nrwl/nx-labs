import {
  ExecutorContext,
  joinPathFragments,
  logger,
  stripIndents,
} from '@nx/devkit';
import * as chalk from 'chalk';
import { dirname, join, resolve } from 'path';
import { BuildExecutorSchema } from './schema';

import { ensureDirSync, unlinkSync, writeFileSync } from 'fs-extra';
import { CopyAssetsHandler } from '@nx/js/src/utils/assets/copy-assets-handler'
import { processCommonArgs } from '../../utils/arg-utils';
import { assertDenoInstalled, runDeno } from '../../utils/run-deno';

export async function denoEsbuildExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  assertDenoInstalled();
  const opts = normalizeOptions(options, context);
  const args = createArgs(opts, context);

  logger.info(
    `Using ${chalk.bold('esbuild')} to build ${chalk.bold(
      opts.main
    )} (https://deno.land/x/esbuild)`
  );

  const projectRoot = context.projectGraph.nodes[context.projectName].data.root;
  const outputPath = dirname(opts.outputFile);

  const assetHandler = new CopyAssetsHandler({
    projectDir: projectRoot,
    rootDir: context.root,
    outputDir: outputPath,
    assets: opts.assets,
  });

  const esbuildResult = await new Promise<boolean>((resolve) => {
    const runningDenoProcess = runDeno(args);

    runningDenoProcess.on('exit', (code) => {
      resolve(code === 0);
    });
  });

  if (esbuildResult !== true) {
    return { success: false };
  }

  let copyAssetsResult = true;
  try {
    await assetHandler.processAllAssetsOnce();
  } catch {
    copyAssetsResult = false;
  }

  return { success: copyAssetsResult };
}

function normalizeOptions(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  // TODO: we might need to normalize paths here to make sure it works on windows?
  if (!options.denoConfig) {
    throw new Error('denoConfig is required');
  }
  if (!options.main) {
    throw new Error('main is required');
  }
  if (!options.outputFile) {
    options.outputFile = join('dist', options.main);
  }

  ensureDirSync(resolve(context.root, dirname(options.outputFile)));

  options.bundle ??= true;

  options.sourceMap ??= 'inline';

  return options;
}

function createArgs(options: BuildExecutorSchema, context: ExecutorContext) {
  const tmpBundleFile = createTempEsbuildFile(options, context);
  const args = ['run', '--allow-all'];

  args.push(...processCommonArgs(options));

  args.push(tmpBundleFile);

  return args;
}

function createTempEsbuildFile(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  const project = context.projectGraph.nodes[context.projectName];
  const tmpBundleFile = join(
    context.root,
    'tmp',
    project.data.root,
    'deno-esbuild.ts'
  );
  // on windows paths get mistranslated to single slash, C:\blah, which causes issues in deno.
  // use unix style path with file:/// protocol instead to avoid this.
  const configFilePath = joinPathFragments(context.root, options.denoConfig);
  const mainFilePath = joinPathFragments(context.root, options.main);
  const outputFilePath = joinPathFragments(context.root, options.outputFile);

  const content = stripIndents`
      import * as esbuild from "https://deno.land/x/esbuild@v0.18.10/mod.js";
      import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.8.1/mod.ts";

      const result = await esbuild.build({
        plugins: [
          ...denoPlugins({
            loader: "native",
            configPath: "${configFilePath}"
          })
        ],
        entryPoints: ["${mainFilePath}"],
        outfile: "${outputFilePath}",
        bundle: ${options.bundle},
        sourcemap: ${options.sourceMap === false ? false : `"${options.sourceMap}"`},
        format: "esm",
      });
      
      console.log(result.outputFiles);
      
      esbuild.stop();
    `;

  process.on('exit', () => cleanupTmpBundleFile(tmpBundleFile));
  ensureDirSync(dirname(tmpBundleFile));
  writeFileSync(tmpBundleFile, content);

  return tmpBundleFile;
}

function cleanupTmpBundleFile(tmpFile: string) {
  try {
    if (tmpFile) {
      unlinkSync(tmpFile);
    }
  } catch (e) {
    // nothing
  }
}

export default denoEsbuildExecutor;
