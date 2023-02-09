import { ExecutorContext, logger } from '@nrwl/devkit';
import { emptyDirSync } from 'fs-extra';
import { join, posix, resolve, sep } from 'path';
import { processTypeCheckOption } from '../../utils/arg-utils';
import { runDeno } from '../../utils/run-deno';
import { DenoTestExecutorSchema } from './schema';

interface DenoTestExecutorNormalizedSchema extends DenoTestExecutorSchema {
  enableCoverage: boolean;
  testDir: string;
  /*
   * Full path to the coverage directory in the OS styled path
   **/
  coverageDirectoryFullPath?: string;
}

export async function denoTestExecutor(
  options: DenoTestExecutorSchema,
  context: ExecutorContext
) {
  const opts = normalizeOptions(options, context);

  const args = createArgs(opts);

  const runningDenoProcess = runDeno(args);

  return await new Promise<{ success: boolean }>((res) => {
    runningDenoProcess.on('close', (code) => {
      res({ success: code === 0 });
    });
  }).then((testStatus) => collectTestCoverate(opts, testStatus));
}

function normalizeOptions(
  options: DenoTestExecutorSchema,
  context: ExecutorContext
): DenoTestExecutorNormalizedSchema {
  const projectConfig =
    context.projectGraph?.nodes?.[context.projectName]?.data;

  if (!projectConfig) {
    throw new Error(
      `Could not find project configuration for ${context.projectName} in executor context.`
    );
  }
  const normalized: DenoTestExecutorNormalizedSchema = {} as any;

  if (options.coverageDirectory) {
    normalized.coverageDirectoryFullPath = resolve(
      // coverageDirectory will always be unix style path. make sure its normalized to the OS style paths
      join(context.root, options.coverageDirectory).split(posix.sep).join(sep)
    );
    normalized.enableCoverage = !options.watch && !options.inspect;

    try {
      emptyDirSync(normalized.coverageDirectoryFullPath);
    } catch (e) {
      logger.warn(
        `NX Unable to clear the coverage directory, ${normalized.coverageDirectoryFullPath}`
      );
      logger.error(e);
    }
  }

  normalized.testDir = projectConfig.sourceRoot || projectConfig.root;

  return {
    ...options,
    ...normalized,
  };
}

async function collectTestCoverate(
  options: DenoTestExecutorNormalizedSchema,
  testStatus: { success: boolean }
) {
  return new Promise<{ success: boolean }>((res) => {
    if (options.enableCoverage && options.coverageDirectory) {
      const coverageProcess = runDeno(['coverage', options.coverageDirectory]);
      coverageProcess.on('close', (code) => {
        res({ success: code === 0 && testStatus.success });
      });
    } else {
      res(testStatus);
    }
  });
}

function createArgs(options: DenoTestExecutorNormalizedSchema) {
  // NOTE: deno requires = for assigning values for args
  const args: Array<string | boolean | number> = ['test', '-A'];

  args.push(`--config=${options.denoConfig}`);
  if (options.watch) {
    args.push('--watch');
  }

  if (options.coverageDirectory) {
    if (options.inspect) {
      logger.info('NX using --inspect turns off code coverage');
    } else {
      args.push(`--coverage=${options.coverageDirectory}`);
    }
  }

  if (options.check !== undefined) {
    args.push(processTypeCheckOption(options.check));
  }

  if (options.cert) {
    args.push('--cert', options.cert);
  }

  if (options.failFast) {
    args.push(
      `--fail-fast${
        typeof options.failFast === 'number' ? `=${options.failFast}` : ''
      }`
    );
  }

  if (options.filter) {
    args.push(`--filter=${options.filter}`);
  }

  if (options.ignore) {
    args.push(`--ignore=${options.ignore.join(',')}`);
  }

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

  if (options.parallel) {
    args.push('--parallel');
    if (typeof options.parallel === 'number') {
      process.env.DENO_JOBS = `${options.parallel}`;
    }
  }

  if (options.quiet) {
    args.push('--quiet');
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

  if (options.shuffle) {
    args.push(`--shuffle=${options.shuffle}`);
  }

  if (options.unstable) {
    args.push('--unstable');
  }

  args.push(options.testDir);
  return args;
}
export default denoTestExecutor;
