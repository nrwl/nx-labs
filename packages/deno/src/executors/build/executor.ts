import { ExecutorContext, workspaceRoot } from '@nrwl/devkit';
import { dirname, join, resolve } from 'path';
import { BuildExecutorSchema } from './schema';

import { ensureDirSync } from 'fs-extra';
import { runDeno } from '../../utils/run-deno';

export default async function runExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  const opts = normalizeOptions(options);
  const args = createArgs(opts);

  const runningDenoProcess = runDeno(args);

  const res = new Promise((res) => {
    runningDenoProcess.on('exit', (code) => {
      res({ success: code === 0 });
    });
  });

  return res;
}

function normalizeOptions(options: BuildExecutorSchema) {
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

  ensureDirSync(resolve(workspaceRoot, dirname(options.outputFile)));

  return options;
}

function createArgs(options: BuildExecutorSchema) {
  const args = ['bundle'];

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

  if (options.unstable) {
    args.push(`--unstable`);
  }

  if (options.watch) {
    args.push(`--watch`);
  }

  args.push(options.main);

  args.push(options.outputFile || join('dist', options.main));

  return args;
}
