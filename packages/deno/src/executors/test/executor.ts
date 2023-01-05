import { ExecutorContext, logger } from '@nrwl/devkit';
import { emptyDirSync } from 'fs-extra';
import { join, posix, resolve, sep } from 'path';
import { runDeno } from '../../utils/run-deno';
import { DenoTestExecutorSchema } from './schema';

export default async function runExecutor(
  options: DenoTestExecutorSchema,
  context: ExecutorContext
) {
  const projectConfig =
    context.projectGraph?.nodes?.[context.projectName]?.data;

  if (!projectConfig) {
    throw new Error(
      `Could not find project configuration for ${context.projectName} in executor context.`
    );
  }

  const args = normalizeOptions(options);
  args.push(projectConfig.sourceRoot || projectConfig.root);
  if (options.coverageDirectory) {
    const fullPathToCoverageDir = resolve(
      join(context.root, options.coverageDirectory).split(posix.sep).join(sep)
    );
    try {
      emptyDirSync(fullPathToCoverageDir);
    } catch (e) {
      logger.error(
        `NX Unable to clear the coverage directory, ${fullPathToCoverageDir}`
      );
      logger.error(e);
    }
  }

  const runningDenoProcess = runDeno(args);

  const testProcess = await new Promise<{ success: boolean }>((res) => {
    runningDenoProcess.on('close', (code) => {
      res({ success: code === 0 });
    });
  });

  return new Promise((res) => {
    if (options.coverageDirectory && !options.watch && !options.inspect) {
      const coverageProcess = runDeno(['coverage', options.coverageDirectory]);
      coverageProcess.on('close', (code) => {
        res({ success: code === 0 && testProcess.success });
      });
    }

    res(testProcess);
  });
}

function normalizeOptions(options: DenoTestExecutorSchema) {
  console.log(options);
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

  console.log(args);
  return args;
}
