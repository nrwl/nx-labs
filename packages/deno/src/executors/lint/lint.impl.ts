import { ExecutorContext, ProjectConfiguration } from '@nx/devkit';
import { processCommonArgs } from '../../utils/arg-utils';
import { assertDenoInstalled, runDeno } from '../../utils/run-deno';
import { LintExecutorSchema } from './schema';

interface LintExecutorNormalizedSchema extends LintExecutorSchema {
  lintDir: string;
}
export async function denoLintExecutor(
  options: LintExecutorSchema,
  context: ExecutorContext
) {
  assertDenoInstalled();
  const projectConfig =
    context.projectGraph?.nodes?.[context.projectName]?.data;

  if (!projectConfig) {
    throw new Error(
      `Could not find project configuration for ${context.projectName} in executor context.`
    );
  }
  const opts = normalizeOpitons(options, projectConfig);

  const args = createArgs(opts);

  const runningDenoProcess = runDeno(args);

  return new Promise<{ success: boolean }>((resolve) => {
    runningDenoProcess.on('close', (code) => {
      resolve({ success: code === 0 });
    });
  });
}

function normalizeOpitons(
  options: LintExecutorSchema,
  projectConfig: ProjectConfiguration
): LintExecutorNormalizedSchema {
  return {
    ...options,
    lintDir: projectConfig.sourceRoot || projectConfig.root,
  };
}

function createArgs(options: LintExecutorNormalizedSchema) {
  const args: string[] = ['lint'];

  args.push(`--config=${options.denoConfig}`);
  args.push(...processCommonArgs(options));

  if (options.compact) {
    args.push('--compact');
  }

  if (options.ignore) {
    args.push(`--ignore=${options.ignore}`);
  }

  if (options.json) {
    args.push('--json');
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

  args.push(options.lintDir);

  return args;
}

export default denoLintExecutor;
