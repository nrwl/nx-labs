import { ExecutorContext, logger, output } from '@nx/devkit';
import { createAsyncIterable } from '@nx/devkit/src/utils/async-iterable';
import { Stats } from '@rspack/core';
import { existsSync, rmSync } from 'fs';
import * as path from 'path';
import { createCompiler } from '../../utils/create-compiler';
import { isMode } from '../../utils/mode-utils';
import { RspackExecutorSchema } from './schema';
import { spawn } from 'child_process';
import { resolve } from 'path';
import chalk = require('chalk');

export default async function* runExecutor(
  options: RspackExecutorSchema,
  context: ExecutorContext
) {
  process.env.NODE_ENV ??= options.mode ?? 'production';

  if (isMode(process.env.NODE_ENV)) {
    options.mode = process.env.NODE_ENV;
  }
  // Mimic --clean from webpack.
  rmSync(path.join(context.root, options.outputPath), {
    force: true,
    recursive: true,
  });

  if (options.typeCheck) {
    await runTypeCheck(options, context);
  }

  const compiler = await createCompiler(options, context);

  const iterable = createAsyncIterable<{
    success: boolean;
    outfile?: string;
  }>(async ({ next, done }) => {
    if (options.watch) {
      const watcher= compiler.watch(
        {},
        async (err, stats: Stats) => {
          if (err) {
            logger.error(err);
            next({ success: false });
            return;
          }
          if (!compiler || !stats) {
            logger.error(new Error('Compiler or stats not available'));
            next({ success: false });
            return;
          }

          const statsOptions = compiler.options
            ? compiler.options.stats
            : undefined;
          const printedStats = stats.toString(statsOptions);
          // Avoid extra empty line when `stats: 'none'`
          if (printedStats) {
            console.error(printedStats);
          }
          next({
            success: !stats.hasErrors(),
            outfile: path.resolve(context.root, options.outputPath, 'main.js'),
          });
        }
      );

      registerCleanupCallback(() => {
        watcher.close(() => {
          logger.info('Watcher closed');
        });
      });
    } else {
      compiler.run(async (err, stats: Stats) => {
        compiler.close(() => {
          if (err) {
            logger.error(err);
            next({ success: false });
            return;
          }
          if (!compiler || !stats) {
            logger.error(new Error('Compiler or stats not available'));
            next({ success: false });
            return;
          }

          const statsOptions = compiler.options
            ? compiler.options.stats
            : undefined;
          const printedStats = stats.toString(statsOptions);
          // Avoid extra empty line when `stats: 'none'`
          if (printedStats) {
            console.error(printedStats);
          }
          next({
            success: !stats.hasErrors(),
            outfile: path.resolve(context.root, options.outputPath, 'main.js'),
          });
          done();
        });
      });
    }
  });

  yield* iterable;
}

// copied from packages/esbuild/src/executors/esbuild/esbuild.impl.ts
function registerCleanupCallback(callback: () => void) {
  const wrapped = () => {
    callback();
    process.off('SIGINT', wrapped);
    process.off('SIGTERM', wrapped);
    process.off('exit', wrapped);
  };

  process.on('SIGINT', wrapped);
  process.on('SIGTERM', wrapped);
  process.on('exit', wrapped);
}

async function runTypeCheck(
  options: RspackExecutorSchema,
  context: ExecutorContext
) {
  let tsFilePath = options.tsConfig && resolve(options.tsConfig);

  if (!tsFilePath) {
    const projectConfiguration =
      context.projectsConfigurations!.projects[context.projectName!];
    const tsFileName =
      projectConfiguration.projectType === 'application'
        ? 'tsconfig.app.json'
        : 'tsconfig.lib.json';
    tsFilePath = resolve(projectConfiguration.root, tsFileName);
  }
  if (!existsSync(tsFilePath)) {
    const customTsConfigMessage = options.tsConfig
      ? ''
      : ` If project's tsconfig file name is not standard, provide the path to it as "tsConfig" executor option.`;
    throw new Error(
      `Could not find tsconfig at "${tsFilePath}".` + customTsConfigMessage
    );
  }

  const typeCheckCommand = `npx tsc --incremental --noEmit --pretty -p ${tsFilePath}`;
  output.log({
    title: `Running type check for the "${context.projectName}"..`,
    bodyLines: [chalk.dim(typeCheckCommand)],
  });

  const exitCode = await spawnChecker(typeCheckCommand);
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

function spawnChecker(typeCheckCommand: string) {
  return new Promise<number>((r) => {
    const proc = spawn(typeCheckCommand, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
      // shell is necessary on windows to get the process to even start.
      // Command line args constructed by checkers therefore need to escape double quotes
      // to have them not striped out by cmd.exe. Using shell on all platforms lets us avoid
      // having to perform platform-specific logic around escaping quotes since all platform
      // shells will strip out unescaped double quotes. E.g. shell=false on linux only would
      // result in escaped quotes not being unescaped.
      shell: true,
    });

    proc.on('exit', (code) => {
      if (code !== null && code !== 0) {
        r(code);
      } else {
        r(0);
      }
    });
  });
}