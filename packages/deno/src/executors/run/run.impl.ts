import {
  ExecutorContext,
  parseTargetString,
  readTargetOptions,
} from '@nrwl/devkit';
import { processCommonArgs } from '../../utils/arg-utils';
import { runDeno } from '../../utils/run-deno';
import { BuildExecutorSchema } from '../bundle/schema';
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
  args.push(...processCommonArgs(options));

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

  if (options.seed) {
    args.push(`--seed=${options.seed}`);
  }

  args.push(options.main);

  return args;
}

export default denoServeExecutor;
