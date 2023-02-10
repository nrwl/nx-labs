export type DenoTypeCheck = boolean | 'none' | 'local' | 'all';

/**
 * @returns the Deno flag to enable type checking based on the input schema value
 * */
export function processTypeCheckOption(check: DenoTypeCheck): string {
  if (check === 'none' || check === false) {
    return '--no-check';
  }
  if (check === 'all') {
    return '--check=all';
  }
  return '--check';
}

/**
 * handle args for:
 *  --cert
 *  --check
 *  --lock-write
 *  --no-lock
 *  --no-npm
 *  --no-remote
 *  --node-modules-dir
 *  --quiet
 *  --reload
 *  --unstable
 *  --watch
 **/
export function processCommonArgs(options: Record<string, any>): string[] {
  const args: string[] = [];
  if (options.cert) {
    args.push(`--cert=${options.cert}`);
  }
  if (options.check !== undefined) {
    args.push(processTypeCheckOption(options.check));
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

  return args;
}
