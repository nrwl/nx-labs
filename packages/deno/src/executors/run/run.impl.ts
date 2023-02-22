import {
  ExecutorContext,
  parseTargetString,
  readTargetOptions,
} from '@nrwl/devkit';
import { ChildProcess } from 'child_process';
import { processCommonArgs } from '../../utils/arg-utils';
import { runDeno } from '../../utils/run-deno';
import { BuildExecutorSchema } from '../bundle/schema';
import { ServeExecutorSchema } from './schema';

import { createAsyncIterable } from '@nrwl/devkit/src/utils/async-iterable';

export async function* denoServeExecutor(
  options: ServeExecutorSchema,
  context: ExecutorContext
) {
  const opts = normalizeOptions(options, context);
  const args = createArgs(opts);

  yield* createAsyncIterable(({ next, done }) => {
    const runningDenoProcess = runDeno(args);

    process.on('SIGTERM', async () => {
      await killCurrentProcess(runningDenoProcess, 'SIGTERM');
      process.exit(128 + 15);
    });

    process.on('SIGINT', async () => {
      await killCurrentProcess(runningDenoProcess, 'SIGINT');
      process.exit(128 + 2);
    });

    process.on('SIGHUP', async () => {
      await killCurrentProcess(runningDenoProcess, 'SIGHUP');
      process.exit(128 + 1);
    });

    runningDenoProcess.on('exit', (code) => {
      next({ success: code === 0 });
      if (!opts.watch) {
        done();
      }
    });
  });
}

function normalizeOptions(
  options: ServeExecutorSchema,
  context: ExecutorContext
) {
  let mergedOptions: ServeExecutorSchema;
  if (options.buildTarget) {
    const target = parseTargetString(options.buildTarget, context.projectGraph);
    const buildTargetOptions = readTargetOptions<BuildExecutorSchema>(
      target,
      context
    );
    mergedOptions = {
      ...buildTargetOptions,
      ...options,
    };
  }

  if (!mergedOptions.main) {
    throw new Error(
      'Missing "main" property  in the executor options.  Please specify the "main" property in the executor options or specify a "buildTarget" that has a valid "main" property defined.'
    );
  }

  if (!mergedOptions.denoConfig) {
    throw new Error(
      'Missing "denoConfig" property in the executor options.  Please specify the "denoConfig" property in the executor options or specify a "buildTarget" that has a valid "denoConfig" property defined.'
    );
  }

  return mergedOptions;
}

function createArgs(options: ServeExecutorSchema) {
  const args = ['run', '--allow-all'];

  args.push(`--config=${options.denoConfig}`);
  args.push(...processCommonArgs(options));

  if (options.inspect) {
    args.push(
      `--inspect-brk=${
        typeof options.inspect === 'string' ? options.inspect : '127.0.0.1:9229'
      }`
    );
  }

  if (options.location) {
    args.push(`--location=${options.location}`);
  }

  if (options.seed) {
    args.push(`--seed=${options.seed}`);
  }

  args.push(options.main);

  return args;
}

async function killCurrentProcess(
  currentProcess: ChildProcess,
  signal: string
) {
  // if the currentProcess.killed is false, invoke kill()
  // to properly send the signal to the process
  if (!currentProcess.killed) {
    currentProcess.kill(signal as NodeJS.Signals);
  }
}

export default denoServeExecutor;
