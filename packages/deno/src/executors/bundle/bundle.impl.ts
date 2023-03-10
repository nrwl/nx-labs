import { workspaceRoot } from '@nrwl/devkit';
import { dirname, join, resolve } from 'path';
import { BuildExecutorSchema } from './schema';

import { ensureDirSync } from 'fs-extra';
import { processCommonArgs } from '../../utils/arg-utils';
import { assertDenoInstalled, runDeno } from '../../utils/run-deno';

export async function denoBuildExecutor(options: BuildExecutorSchema) {
  assertDenoInstalled();
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

  args.push(...processCommonArgs(options));

  args.push(options.main);

  args.push(options.outputFile || join('dist', options.main));

  return args;
}
export default denoBuildExecutor;
