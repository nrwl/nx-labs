#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const project = args.find((s) => !s.startsWith('-')) as string;
const customBase = args.find((s) => s.startsWith('--base=')) as string;
const vercelBase = process.env['VERCEL_GIT_PREVIOUS_SHA'];
const isVerbose = args.some((s) => s === '--verbose');
const headSha = 'HEAD';
let baseSha = customBase ? customBase.slice(7) : vercelBase || 'HEAD^';

if (!project) {
  console.log('≫ No project passed to nx-ignore script');
  process.exit(1);
}

console.log(
  `≫ Using Nx to determine if this project (${project}) is affected by the commit...`
);

main();

async function main() {
  logDebug(`nx-ignore version "${require('../package.json').version}"`);
  logDebug(`cwd is "${process.cwd()}"`);
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = require(packageJsonPath);
  let nxVersion: string;
  let isDevDep = true;

  if (packageJson.dependencies['nx']) {
    nxVersion = packageJson.dependencies['nx'];
    isDevDep = false;
  } else if (packageJson.devDependencies['nx']) {
    nxVersion = packageJson.devDependencies['nx'];
  } else {
    console.log(
      '≫ Could not find Nx in the workspace, continuing the build just in case.'
    );
    process.exit(1);
  }

  let installCmd: string;
  if (existsSync(join(process.cwd(), 'yarn.lock'))) {
    installCmd = 'yarn add';
  } else if (existsSync(join(process.cwd(), 'pnpm-lock.yaml'))) {
    installCmd = 'pnpm install';
  } else {
    installCmd = 'npm install';
  }
  installCmd = `${installCmd} ${isDevDep ? '-D' : ''} nx@${nxVersion}`;
  logDebug(`Installing Nx: ${installCmd}`);
  execSync(installCmd);

  const { findWorkspaceRoot } = require(join(
    process.cwd(),
    'node_modules/nx/src/utils/find-workspace-root'
  ));
  const root = findWorkspaceRoot(process.cwd());

  if (!root) {
    console.log('≫ Could not find Nx root');
    process.exit(1);
  }

  // Disable daemon so we always generate new graph.
  process.env.NX_DAEMON = 'false';

  let result = { projects: [] as string[] };

  if (baseSha !== 'HEAD^') {
    logDebug(`\n≫ Validating base ref: ${baseSha}\n`);
    try {
      execSync(`git show ${baseSha}`);
    } catch {
      logDebug(
        `\n≫ Invalid base ref passed: ${baseSha}. Defaulting to HEAD^.\n`
      );
      baseSha = 'HEAD^';
    }
  }

  logDebug(`\n≫ Comparing ${baseSha}...${headSha}\n`);

  // TODO(jack): This console.log hack isn't needed if Nx can support being installed outside of cwd.
  const _log = console.log;

  try {
    let output = '';
    console.log = (x) => {
      output = x;
    };

    // Ensure graph is created
    await require(join(
      process.cwd(),
      'node_modules/nx/src/project-graph/project-graph'
    )).createProjectGraphAsync();

    // Since Nx currently looks for "nx" package under workspace root, the CLI doesn't work on Vercel.
    // Call the file directly instead of going through Nx CLI.
    await require(join(
      process.cwd(),
      'node_modules/nx/src/command-line/affected'
    )).affected('print-affected', {
      type: 'app',
      base: 'HEAD^',
      head: 'HEAD',
      _: '',
    });

    result = JSON.parse(output);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    console.log = _log;
  }

  logDebug(`≫ Affected projects:\n  - ${result.projects.join('\n  - ')}\n`);

  if (result.projects.includes(project)) {
    console.log(`✅ - Build can proceed since ${project} is affected`);
    process.exit(1); // this tells vercel to not ignore
  } else {
    console.log(`🛑 - Build cancelled since ${project} is not affected`);
  }

  process.exit(0);
}

function logDebug(s: string) {
  if (isVerbose) console.log(s);
}
