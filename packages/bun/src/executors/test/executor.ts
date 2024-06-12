import { ExecutorContext } from '@nx/devkit';
import { createAsyncIterable } from '@nx/devkit/src/utils/async-iterable';

import { ExecOptions, UnifiedChildProcess, assertBunAvailable, executeCliAsync, isBunSubprocess } from '../../utils/bun-cli';
import { TestExecutorSchema } from './schema';
import { ChildProcess } from 'child_process';

interface TestExecutorNormalizedSchema extends TestExecutorSchema {
  testDir: string;
}

interface ActiveTask {
  id: string;
  killed: boolean;
  childProcess: null | UnifiedChildProcess;
  start: () => Promise<void>;
  stop: (signal: NodeJS.Signals) => Promise<void>;
}

const activeTasks: ActiveTask[] = [];

export default async function* runExecutor(
  options: TestExecutorSchema,
  context: ExecutorContext
) {
  await assertBunAvailable();
  const opts = normalizeOptions(options, context);
  const args = createArgs(opts);

  const task: ActiveTask = createTask(args, {});
  activeTasks.push(task);

  await task.start();

  process.on('SIGTERM', () => stopAllActiveTasks('SIGTERM'));
  process.on('SIGINT', () => stopAllActiveTasks('SIGINT'));
  process.on('SIGHUP', () => stopAllActiveTasks('SIGHUP'));
  process.on('uncaughtException', (err) => {
    console.error('Caught exception:', err);
    stopAllActiveTasks('SIGTERM').finally(() => process.exit(1));
  });

  yield* createAsyncIterable(async ({ next, done }) => {
    if (isBunSubprocess(task.childProcess)) {
      await task.childProcess?.exited;
    } else {
      await new Promise<void>((resolve) => {
        (task.childProcess as ChildProcess)?.on('exit', () => {
          resolve();
        });
      });
    }

    next({ success: !task.killed });
    if (!options.watch) {
      done();
    }
  });
}

function createTask(args: string[], options: ExecOptions): ActiveTask {
  const id = crypto.randomUUID();
  const childProcess: UnifiedChildProcess | null = null;

  const start = async () => {
    for await (const message of executeCliAsync(args, options)) {
      handleMessage('stdout', message);
    }
  };

  const stop = async (signal: NodeJS.Signals) => {
    if (childProcess) {
      childProcess.kill(signal)
    }
  };

  const task: ActiveTask = {
    id,
    killed: false,
    childProcess,
    start,
    stop,
  };

  return task;
}

function handleMessage(type: 'stdout' | 'stderr', message: string) {
  if (process.send) {
    process.send({ type, message });
  } else {
    if (type === 'stdout') {
      console.log(message);
    } else {
      console.error(message);
    }
  }
}

function createArgs(options: TestExecutorNormalizedSchema) {
  const args: string[] = ['test', `--cwd=${options.testDir}`];

  if (options.smol) {
    args.push('--smol');
  }

  if (options.config) {
    args.push(`-c ${options.config}`);
  }
  if (options.tsConfig) {
    args.push(`--tsconfig-override=${options.tsConfig}`);
  }

  if (typeof options.bail === 'boolean') {
    args.push('--bail');
  } else if (typeof options.bail === 'number') {
    args.push(`--bail=${options.bail}`);
  }
  if (options.preload) {
    args.push(`--preload=${options.preload}`);
  }
  if (options.timeout) {
    args.push(`--timeout=${options.timeout}`);
  }

  if (options.rerunEach) {
    args.push(`--rerun-each=${options.rerunEach}`);
  }
  if (options.watch) {
    args.push('--watch');
  }
  return args;
}

function normalizeOptions(
  options: TestExecutorSchema,
  context: ExecutorContext
): TestExecutorNormalizedSchema {
  const projectConfig =
    context.projectGraph?.nodes?.[context.projectName]?.data;

  if (!projectConfig) {
    throw new Error(
      `Could not find project configuration for ${context.projectName} in executor context.`
    );
  }
  return {
    ...options,
    testDir: projectConfig.sourceRoot || projectConfig.root,
  };
}

async function stopAllActiveTasks(signal: NodeJS.Signals) {
  for (const task of activeTasks) {
    if (!task.killed) {
      await task.stop(signal);
    }
  }
}
