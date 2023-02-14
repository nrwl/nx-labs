import { workspaceRoot } from '@nrwl/devkit';
import { spawn } from 'child_process';

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
    // TODO: make sure this doesn't popup cmd on windows?
    windowsHide: true,
  });
}
