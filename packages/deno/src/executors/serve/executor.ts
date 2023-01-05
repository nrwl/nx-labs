import {
  ExecutorContext,
  parseTargetString,
  readTargetOptions,
} from '@nrwl/devkit';
import { runDeno } from '../../utils/run-deno';
import { BuildExecutorSchema } from '../build/schema';
import { ServeExecutorSchema } from './schema';

export default async function* runExecutor(
  options: ServeExecutorSchema,
  context: ExecutorContext
) {
  const opts = normalizeOptions(options, context);
  const args = createArgs(opts);

  const runningDenoProcess = runDeno(args);

  yield { success: true };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await new Promise(() => {});
}

function normalizeOptions(
  options: ServeExecutorSchema,
  context: ExecutorContext
) {
  const target = parseTargetString(options.buildTarget);
  const buildTargetOptions = readTargetOptions<BuildExecutorSchema>(
    target,
    context
  );
  const mergedOptions = {
    ...buildTargetOptions,
    ...options,
  };

  if (!mergedOptions.main) {
    throw new Error('main is required');
  }

  if (!mergedOptions.denoConfig) {
    throw new Error('denoConfig is required');
  }

  return mergedOptions;
}

function createArgs(options: ServeExecutorSchema) {
  const args = ['run', '--allow-all'];

  args.push(`--config=${options.denoConfig}`);
  if (options.cert) {
    args.push(`--cert=${options.cert}`);
  }
  if (options.check !== undefined) {
    // TODO(caleb): why are boolean args being parsed as strings?
    if (
      options.check === 'none' ||
      options.check === false ||
      options.check === 'false'
    ) {
      args.push('--no-check');
    } else if (
      options.check === 'local' ||
      options.check === true ||
      options.check === 'true'
    ) {
      args.push('--check');
    } else if (options.check === 'all') {
      args.push('--check=all');
    }
  }
  if (options.inspect) {
    args.push(
      `--inspect-brk=${
        typeof options.inspect === 'string'
          ? `${options.inspect}`
          : '127.0.0.1:9229'
      }`
    );
  }
  if (options.location) {
    args.push(`--location=${options.location}`);
  }
  if (options.lockWrite) {
    args.push(`--lock-write`);
  }
  if (options.noLock) {
    args.push(`--no-lock`);
  }
  if (options.noNpm) {
    args.push(`--no-npm`);
  }
  if (options.noRemote) {
    args.push(`--no-remote`);
  }
  if (options.nodeModulesDir) {
    args.push(`--node-modules-dir=${options.nodeModulesDir}`);
  }
  if (options.quiet) {
    args.push(`--quiet`);
  }
  if (options.reload) {
    args.push(
      `--reload${
        typeof options.reload === 'string' ? `=${options.reload}` : ''
      }`
    );
  }
  if (options.seed) {
    args.push(`--seed=${options.seed}`);
  }
  if (options.unstable) {
    args.push('--unstable');
  }

  if (options.watch) {
    args.push('--watch');
  }

  args.push(options.main);

  return args;
}
