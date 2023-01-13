#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync } = require('child_process');
const { existsSync, readFileSync, renameSync, writeFileSync } = require('fs');
const { join } = require('path');

const args = process.argv.slice(2);
const project = args.find((s) => !s.startsWith('-')) as string;
const customBase = args.find(
  (s) => s.startsWith('--base=') || s.startsWith('--base ')
) as string;
const customRoot = args.find(
  (s) => s.startsWith('--root=') || s.startsWith('--root ')
) as string;
const vercelBase = process.env['VERCEL_GIT_PREVIOUS_SHA'];
const isVerbose = args.some((s) => s === '--verbose');
const headSha = 'HEAD';
const userDefinedRoot = customRoot ? customRoot.slice(7) : null;
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
  const root = userDefinedRoot || process.cwd();

  logDebug(`≫ Running from ${__dirname}`);
  logDebug(`≫ Workspace root is ${root}`);

  const nxVersion = ensureNxInstalled(root);

  if (!nxVersion) {
    console.log('≫ Cannot find installed Nx');
    process.exit(1);
  }

  logDebug(`≫ Found Nx at version ${nxVersion}`);

  // Disable daemon so we always generate new graph.
  process.env.NX_DAEMON = 'false';

  let result = { projects: [] as string[] };

  // Branch may not contain last deployed SHA
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

  const output = execSync(
    `npx nx print-affected --base=${baseSha} --head=${headSha}`,
    {
      cwd: root,
    }
  ).toString();
  result = JSON.parse(output);

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

export function detectPackageManager(root: string): 'npm' | 'yarn' | 'pnpm' {
  return existsSync(join(root, 'yarn.lock'))
    ? 'yarn'
    : existsSync(join(root, 'pnpm-lock.yaml'))
    ? 'pnpm'
    : 'npm';
}

// This function ensures that Nx is installed in the workspace.
// Returns the version of Nx if found, null otherwise.
function ensureNxInstalled(root: string): string | null {
  try {
    const packageJson = require(join(root, 'package.json'));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    const pm = detectPackageManager(root);

    // create temp package.json to avoid install other packages
    const json = JSON.parse(readFileSync(join(root, 'package.json')));
    renameSync(join(root, 'package.json'), join(root, 'package.original.json'));
    delete json['scripts'];
    delete json.dependencies;
    json.devDependencies = {
      nx: deps['nx'],
      next: deps['next'],
      typescript: deps['typescript'],
    };
    writeFileSync(join(root, 'package.json'), JSON.stringify(json));

    if (pm === 'npm') {
      renameSync(
        join(root, 'package-lock.json'),
        join(root, 'package-lock.original.json')
      );
      execSync(`npm install`);
    } else if (pm === 'yarn') {
      renameSync(join(root, 'yarn.lock'), join(root, 'yarn.original.lock'));
      execSync(`yarn install`);
    } else {
      renameSync(
        join(root, 'pnpm-lock.yaml'),
        join(root, 'pnpm-lock.original.yaml')
      );
      execSync(`pnpm install`);
    }

    // Rename package.json back so build can continue as normal
    renameSync(join(root, 'package.original.json'), join(root, 'package.json'));
    if (pm === 'npm') {
      renameSync(
        join(root, 'package-lock.original.json'),
        join(root, 'package-lock.json')
      );
    } else if (pm === 'yarn') {
      renameSync(join(root, 'yarn.original.lock'), join(root, 'yarn.lock'));
    } else {
      renameSync(
        join(root, 'pnpm-lock.original.yaml'),
        join(root, 'pnpm-lock.yaml')
      );
    }

    return deps['nx'];
  } catch {
    // nothing
  }

  return null;
}
