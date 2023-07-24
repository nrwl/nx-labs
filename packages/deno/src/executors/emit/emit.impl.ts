import {
  ExecutorContext,
  joinPathFragments,
  logger,
  readJsonFile,
  stripIndents,
} from '@nx/devkit';
import * as chalk from 'chalk';
import { dirname, join, resolve } from 'path';
import { BuildExecutorSchema } from './schema';

import { CopyAssetsHandler } from '@nx/js/src/utils/assets/copy-assets-handler';
import { ensureDirSync, unlinkSync, writeFileSync } from 'fs-extra';
import { processCommonArgs } from '../../utils/arg-utils';
import { assertDenoInstalled, runDeno } from '../../utils/run-deno';

export async function denoEmitExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  assertDenoInstalled();
  const opts = normalizeOptions(options, context);
  const args = createArgs(opts, context);

  logger.info(
    `Using ${chalk.bold('deno_emit')} to build ${chalk.bold(
      opts.main
    )} (https://deno.land/x/emit)`
  );

  const projectRoot = context.projectGraph.nodes[context.projectName].data.root;
  const outputPath = dirname(opts.outputFile);

  const assetHandler = new CopyAssetsHandler({
    projectDir: projectRoot,
    rootDir: context.root,
    outputDir: outputPath,
    assets: opts.assets,
  });

  const denoEmitResult = await new Promise<boolean>((resolve) => {
    const runningDenoProcess = runDeno(args);

    runningDenoProcess.on('exit', (code) => {
      resolve(code === 0);
    });
  });

  if (denoEmitResult !== true) {
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
  options.assets ??= [];

  options.sourceMap ??= 'inline';
  if (options.sourceMap === true) {
    options.sourceMap = 'inline';
  }

  return options;
}

function createArgs(options: BuildExecutorSchema, context: ExecutorContext) {
  const tmpBundleFile = createTempEmitFile(options, context);
  const args = ['run', '--allow-all'];

  args.push(...processCommonArgs(options));

  args.push(tmpBundleFile);

  return args;
}

function createTempEmitFile(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  const project = context.projectGraph.nodes[context.projectName];
  const tmpBundleFile = join(
    context.root,
    'tmp',
    project.data.root,
    'deno-emit.ts'
  );
  // on windows paths get mistranslated to single slash, C:\blah, which causes issues in deno.
  // use unix style path with file:/// protocol instead to avoid this.
  const mainFilePath = joinPathFragments(context.root, options.main);
  const outputFilePath = joinPathFragments(context.root, options.outputFile);

  // Read the config
  const denoConfigPath = join(context.root, options.denoConfig);
  const denoConfig = readJsonFile(denoConfigPath);
  const importMapPath =
    denoConfig.importMap != null
      ? joinPathFragments(context.root, project.data.root, denoConfig.importMap)
      : null;

  const content = options.bundle
    ? stripIndents`
      import { bundle } from "https://deno.land/x/emit@0.24.0/mod.ts";
      await Deno.mkdir("${dirname(outputFilePath)}", { recursive: true });

      const entryUrl = new URL("file:///${mainFilePath}", import.meta.url);
      const importMapUrl = ${
        importMapPath != null
          ? `new URL("file:///${importMapPath}", import.meta.url)`
          : 'null'
      };
      const result = await bundle(
        entryUrl,
        {
          compilerOptions: {
            inlineSources: ${
              options.sourceMap === 'inline' || options.sourceMap === 'linked'
            },
            inlineSourceMap: ${options.sourceMap === 'inline'},
            sourceMap: ${options.sourceMap === 'linked'},
          },
          importMap: importMapUrl,
        },
      );

      const { code, map } = result;
      await Deno.writeTextFile("${outputFilePath}", code);
      if (map) {
        await Deno.writeTextFile("${outputFilePath}.map", map);
      }
    `
    : stripIndents`
      import { transpile } from "https://deno.land/x/emit@0.24.0/mod.ts";
      await Deno.mkdir("${dirname(outputFilePath)}", { recursive: true });

      const entryUrl = new URL("file:///${mainFilePath}", import.meta.url);
      const importMapUrl = ${
        importMapPath != null
          ? `new URL("file:///${importMapPath}", import.meta.url)`
          : 'null'
      };
      const result = await transpile(
        entryUrl,
        {
          compilerOptions: {
            inlineSources: ${
              options.sourceMap === 'inline' || options.sourceMap === 'linked'
            },
            inlineSourceMap: ${options.sourceMap === 'inline'},
            sourceMap: ${options.sourceMap === 'linked'},
          },
          importMap: importMapUrl,
        },
      );

      const code = result.get(url.href);
      const map = result.get("\${url.href}.map");
      await Deno.writeTextFile("${outputFilePath}", code);
      if (map) {
        await Deno.writeTextFile("${outputFilePath}.map", code);
      }
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

export default denoEmitExecutor;
