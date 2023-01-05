import { ExecutorContext } from '@nrwl/devkit';
import { runDeno } from '../../utils/run-deno';
import { LintExecutorSchema } from './schema';

export async function denoLintExecutor(
  options: LintExecutorSchema,
  context: ExecutorContext
) {
  const args = normalizeOptions(options);
  const projectConfig =
    context.projectGraph?.nodes?.[context.projectName]?.data;

  if (!projectConfig) {
    throw new Error(
      `Could not find project configuration for ${context.projectName} in executor context.`
    );
  }

  args.push(`--config=${options.denoConfig}`);
  args.push(projectConfig.sourceRoot || projectConfig.root);

  const runningDenoProcess = runDeno(args);

  return new Promise<{ success: boolean }>((resolve) => {
    runningDenoProcess.on('close', (code) => {
      resolve({ success: code === 0 });
    });
  });
}

function normalizeOptions(options: LintExecutorSchema) {
  const args: Array<string | boolean> = ['lint'];

  if (options.compact) {
    args.push('--compact');
  }

  if (options.ignore) {
    args.push(`--ignore=${options.ignore}`);
  }

  if (options.json) {
    args.push('--json');
  }

  if (options.quiet) {
    args.push('--quiet');
  }

  if (options.rulesExclude) {
    args.push(`--rules-exclude=${options.rulesExclude}`);
  }

  if (options.rulesInclude) {
    args.push(`--rules-include=${options.rulesInclude}`);
  }

  if (options.rulesTags) {
    args.push(`--rules-tags=${options.rulesTags}`);
  }

  if (options.unstable) {
    args.push('--unstable');
  }

  if (options.watch) {
    args.push('--watch');
  }

  return args;
}

export default denoLintExecutor;
