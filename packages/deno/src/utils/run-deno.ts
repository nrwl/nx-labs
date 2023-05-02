import { stripIndents, workspaceRoot } from '@nx/devkit';
import { execSync, spawn } from 'child_process';

export interface DenoExecOptions {
  /**
   * default is workspaceRoot
   **/
  cwd?: string;
  /**
   * custom env vars to set. default is process.env
   **/
  env?: Record<string, string>;
  stdio?: 'inherit' | 'pipe';
}

export function runDeno(args: any[], options: DenoExecOptions = {}) {
  return spawn('deno', args, {
    stdio: options.stdio || 'inherit',
    cwd: options.cwd || workspaceRoot,
    env: {
      ...process.env,
      ...(options.env || {}),
    },
    windowsHide: true,
  });
}

export function assertDenoInstalled() {
  try {
    execSync('deno --version', {
      encoding: 'utf-8',
      env: process.env,
    });
  } catch (err) {
    throw new Error(stripIndents`Unable to find Deno on your system. 
Deno will need to be installed in order to run targets from @nrwl/deno in this workspace.
You can learn how to install deno at https://deno.land/manual/getting_started/installation
If you've already installed Deno, then make sure it's avaiable in your PATH.
You might need to quit and restart your terminal.`);
  }
}
