import { detectPackageManager, PackageManager } from '@nrwl/devkit';
import {
  directoryExists,
  fileExists,
  tmpProjPath,
} from '@nrwl/nx-plugin/testing';
import { ChildProcess, exec } from 'child_process';
import * as treeKill from 'tree-kill';
import { promisify } from 'util';

const kill = require('kill-port');

function stripConsoleColors(log: string): string {
  return log.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ''
  );
}

function e2eConsoleLogger(message: string, body?: string) {
  process.stdout.write('\n');
  process.stdout.write(`${message}\n`);
  if (body) {
    process.stdout.write(`${body}\n`);
  }
  process.stdout.write('\n');
}

export function workspaceFileExists(path: string) {
  return fileExists(`${tmpProjPath()}/${path}`);
}

export function workspaceDirectoryExists(path: string) {
  return directoryExists(`${tmpProjPath()}/${path}`);
}

export async function killPort(port: number) {
  try {
    e2eConsoleLogger(`Attempting to close port ${port}`);
    await kill(port);
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
  } catch {
    e2eConsoleLogger(`Port ${port} closing failed`);
  }
}

export const promisifiedTreeKill: (
  pid: number,
  signal: string
) => Promise<void> = promisify(treeKill);

export function getPackageManagerCommand({
  path = tmpProjPath(),
  packageManager = detectPackageManager(path),
} = {}): {
  createWorkspace: string;
  run: (script: string, args: string) => string;
  runNx: string;
  runNxSilent: string;
  runUninstalledPackage: string;
  install: string;
  addProd: string;
  addDev: string;
  list: string;
  runLerna: string;
} {
  return {
    npm: {
      createWorkspace: `npx create-nx-workspace@latest`,
      run: (script: string, args: string) => `npm run ${script} -- ${args}`,
      runNx: `npx nx`,
      runNxSilent: `npx nx`,
      runUninstalledPackage: `npx --yes`,
      install: 'npm install',
      addProd: `npm install --legacy-peer-deps`,
      addDev: `npm install --legacy-peer-deps -D`,
      list: 'npm ls --depth 10',
      runLerna: `npx lerna`,
    },
    yarn: {
      // `yarn create nx-workspace` is failing due to wrong global path
      createWorkspace: `yarn global add create-nx-workspace@latest && create-nx-workspace`,
      run: (script: string, args: string) => `yarn ${script} ${args}`,
      runNx: `yarn nx`,
      runNxSilent: `yarn --silent nx`,
      runUninstalledPackage: 'npx --yes',
      install: 'yarn',
      addProd: `yarn add`,
      addDev: `yarn add -D`,
      list: 'npm ls --depth 10',
      runLerna: `yarn lerna`,
    },
    // Pnpm 3.5+ adds nx to
    pnpm: {
      createWorkspace: `pnpm dlx create-nx-workspace@latest`,
      run: (script: string, args: string) => `pnpm run ${script} -- ${args}`,
      runNx: `pnpm exec nx`,
      runNxSilent: `pnpm exec nx`,
      runUninstalledPackage: 'pnpm dlx',
      install: 'pnpm i',
      addProd: `pnpm add`,
      addDev: `pnpm add -D`,
      list: 'npm ls --depth 10',
      runLerna: `pnpm exec lerna`,
    },
  }[packageManager.trim() as PackageManager];
}

export function getStrippedEnvironmentVariables() {
  const strippedVariables = new Set(['NX_TASK_TARGET_PROJECT']);
  return Object.fromEntries(
    Object.entries(process.env).filter(
      ([key, value]) =>
        !strippedVariables.has(key) ||
        !key.startsWith('NX_') ||
        key.startsWith('NX_E2E_')
    )
  );
}

export function runCommandUntil(
  command: string,
  criteria: (output: string) => boolean
): Promise<ChildProcess> {
  const pm = getPackageManagerCommand();
  const p = exec(`${pm.runNx} ${command}`, {
    cwd: tmpProjPath(),
    encoding: 'utf-8',
    env: {
      CI: 'true',
      ...getStrippedEnvironmentVariables(),
      FORCE_COLOR: 'false',
    },
  });
  return new Promise((res, rej) => {
    let output = '';
    let complete = false;

    function checkCriteria(c) {
      output += c.toString();
      process.stdout.write(output);
      if (criteria(stripConsoleColors(output)) && !complete) {
        complete = true;
        res(p);
      }
    }

    p.stdout?.on('data', checkCriteria);
    p.stderr?.on('data', checkCriteria);
    p.on('exit', (code) => {
      if (!complete) {
        rej(`Exited with ${code}`);
      } else {
        res(p);
      }
    });
  });
}
