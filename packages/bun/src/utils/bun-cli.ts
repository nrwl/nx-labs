import { stripIndents } from '@nx/devkit';
import { SpawnOptions, Subprocess } from 'bun';
import { ChildProcess, spawn } from 'child_process';

export const isBun = typeof Bun !== 'undefined';

export type ExecOptions<
  In extends SpawnOptions.Writable = SpawnOptions.Writable,
  Out extends SpawnOptions.Readable = SpawnOptions.Readable,
  Err extends SpawnOptions.Readable = SpawnOptions.Readable
> = BunExecOptions<In, Out, Err> | NodeExecOptions;

type BunExecOptions<
  In extends SpawnOptions.Writable = SpawnOptions.Writable,
  Out extends SpawnOptions.Readable = SpawnOptions.Readable,
  Err extends SpawnOptions.Readable = SpawnOptions.Readable
> = {
  cwd?: string;
  stdin?: In;
  stdout?: Out;
  stderr?: Err;
};

type NodeExecOptions = {
  cwd?: string;
  stdio?: 'inherit' | 'pipe';
};

export function isBunExecOptions<
  In extends SpawnOptions.Writable,
  Out extends SpawnOptions.Readable,
  Err extends SpawnOptions.Readable
>(
  options: ExecOptions<In, Out, Err>
): options is BunExecOptions<In, Out, Err> {
  return isBun;
}

export function isNodeExecOptions(
  options: ExecOptions
): options is NodeExecOptions {
  return !isBun;
}

export type UnifiedChildProcess<
  In extends SpawnOptions.Writable = SpawnOptions.Writable,
  Out extends SpawnOptions.Readable = SpawnOptions.Readable,
  Err extends SpawnOptions.Readable = SpawnOptions.Readable
> = ChildProcess | Subprocess<In, Out, Err>;

export function isBunSubprocess<
  In extends SpawnOptions.Writable = SpawnOptions.Writable,
  Out extends SpawnOptions.Readable = SpawnOptions.Readable,
  Err extends SpawnOptions.Readable = SpawnOptions.Readable
>(process: UnifiedChildProcess): process is Subprocess<In, Out, Err> {
  return isBun && 'exited' in process;
}

export async function assertBunAvailable(forceInstall = false) {
  try {
    if (isBun) {
      Bun.spawnSync({ cmd: ['bun', '--version'] });
      return true;
    } else {
      const { execSync } = await import('child_process');
      execSync('bun --version');
      return true;
    }
  } catch (e) {
    if (forceInstall && !process.env.NX_DRY_RUN) {
      const { execSync } = await import('child_process');
      execSync(`curl -fsSL https://bun.sh/install | bash`);
      return true;
    } else if (forceInstall) {
      throw new Error(
        stripIndents`force install of bun is not supported in dry-run`
      );
    }
    throw new Error(stripIndents`Unable to find Bun on your system.
          Bun will need to be installed in order to run targets from nx-bun in this workspace.
          You can learn how to install bun at https://bun.sh/docs/installation
        `);
  }
}

export async function* executeCliAsync<
  In extends SpawnOptions.Writable = SpawnOptions.Writable,
  Out extends SpawnOptions.Readable = SpawnOptions.Readable,
  Err extends SpawnOptions.Readable = SpawnOptions.Readable
>(
  args: string[],
  options: ExecOptions<In, Out, Err> = {}
): AsyncGenerator<string, void, void> {
  if (isBun) {
    if (isBunExecOptions(options)) {
      const bunOptions: SpawnOptions.OptionsObject<In, Out, Err> = {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env },
        stdin: options.stdin || ('pipe' as In),
        stdout: options.stdout || ('pipe' as Out),
        stderr: options.stderr || ('pipe' as Err),
        ipc(message) {
          console.log(message);
        },
        serialization: "json",
      };

      const childProcess = Bun.spawn(['bun', ...args], bunOptions);

      if (isBunSubprocess(childProcess)) {
        if (childProcess.stdout && typeof childProcess.stdout !== 'number') {
          const stdoutReader = childProcess.stdout.getReader();
          while (true) {
            const { value, done } = await stdoutReader.read();
            if (done) break;
            yield new TextDecoder().decode(value);
          }
        }

        if (childProcess.stderr && typeof childProcess.stderr !== 'number') {
          const stderrReader = childProcess.stderr.getReader();
          while (true) {
            const { value, done } = await stderrReader.read();
            if (done) break;
            yield new TextDecoder().decode(value);
          }
        }

        await childProcess.exited;
      }
    }
  } else {
    if (isNodeExecOptions(options)) {
      const childProcess = spawn('bun', args, {
        cwd: options.cwd || process.cwd(),
        env: { ...process.env },
        windowsHide: true,
        stdio: (options as NodeExecOptions).stdio || 'pipe',
      });

      if (childProcess.stdout) {
        for await (const data of childProcess.stdout) {
          yield data.toString();
        }
      }

      if (childProcess.stderr) {
        for await (const data of childProcess.stderr) {
          yield data.toString();
        }
      }

      let childProcessClosed = false;
      childProcess.on('close', (code) => {
        if (code !== 0) {
          throw new Error(`child process exited with code ${code}`);
        }
        childProcessClosed = true;
      });

      while (!childProcessClosed) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simple polling mechanism
      }
    }
  }
}

export async function executeCliWithLogging<
  In extends SpawnOptions.Writable = SpawnOptions.Writable,
  Out extends SpawnOptions.Readable = SpawnOptions.Readable,
  Err extends SpawnOptions.Readable = SpawnOptions.Readable
>(
  args: string[],
  options: ExecOptions<In, Out, Err> = {}
): Promise<boolean> {
  try {
    for await (const message of executeCliAsync(args, options)) {
      console.log(message);
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
