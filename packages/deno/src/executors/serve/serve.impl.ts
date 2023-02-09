import {
  ExecutorContext,
  parseTargetString,
  readTargetOptions,
} from '@nrwl/devkit';
import { processTypeCheckOption } from '../../utils/arg-utils';
import { runDeno } from '../../utils/run-deno';
import { BuildExecutorSchema } from '../build/schema';
import { ServeExecutorSchema } from './schema';

export async function* denoServeExecutor(
  options: ServeExecutorSchema,
  context: ExecutorContext
) {
  const opts = normalizeOptions(options, context);
  const args = createArgs(opts);

  const runningDenoProcess = runDeno(args);
  // TODO(chau): does process need to be handled differently like @nrwl/js?

  yield { success: true };

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  await new Promise(() => {});
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
  if (options.cert) {
    args.push(`--cert=${options.cert}`);
  }
  if (options.check !== undefined) {
    args.push(processTypeCheckOption(options.check));
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

export default denoServeExecutor;
