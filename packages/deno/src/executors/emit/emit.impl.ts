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

  return new Promise((resolve) => {
    const runningDenoProcess = runDeno(args);

    runningDenoProcess.on('exit', (code) => {
      resolve({ success: code === 0 });
    });
  });
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

  return options;
}

function createArgs(options: BuildExecutorSchema, context: ExecutorContext) {
  const tmpBundleFile = createTempEmitFile(options, context);
  const args = ['run', '--allow-all'];

  args.push(`--config=${options.denoConfig}`);

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

  const content = options.bundle
    ? stripIndents`
      import { bundle } from "https://deno.land/x/emit@0.24.0/mod.ts";
      await Deno.mkdir("${dirname(outputFilePath)}", { recursive: true });

      const result = await bundle(
        new URL("file:///${mainFilePath}", import.meta.url),
      );

      const { code } = result;
      await Deno.writeTextFile("${outputFilePath}", code);
    `
    : stripIndents`
      import { transpile } from "https://deno.land/x/emit@0.24.0/mod.ts";
      await Deno.mkdir("${dirname(outputFilePath)}", { recursive: true });

      const url = new URL("file:///${mainFilePath}", import.meta.url);
      const result = await transpile(url.href);

      const code = result.get(url.href);
      await Deno.writeTextFile("${outputFilePath}", code);
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
