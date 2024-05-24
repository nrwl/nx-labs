#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync } = require('child_process');
const { tmpdir } = require('os');
const {
  existsSync,
  rmSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  moveSync,
} = require('fs-extra');
const { join } = require('path');

const args = process.argv.slice(2);
const project = args.find((s) => !s.startsWith('-')) as string;
const customBase = args.find(
  (s) => s.startsWith('--base=') || s.startsWith('--base ')
) as string;
const customRoot = args.find(
  (s) => s.startsWith('--root=') || s.startsWith('--root ')
) as string;
// Platform specific environment variables.
// See:
// - https://vercel.com/docs/concepts/projects/environment-variables#system-environment-variables
// - https://docs.netlify.com/configure-builds/environment-variables/#git-metadata
const defaultBase =
  process.env['CACHED_COMMIT_REF'] || process.env['VERCEL_GIT_PREVIOUS_SHA'];
const userDefinedPluginsArg = args.find(
  (s) => s.startsWith('--plugins=') || s.startsWith('--plugins ')
) as string;
const userDefinedPlugins = userDefinedPluginsArg
  ? userDefinedPluginsArg.slice(10).split(',')
  : null;
const userDefinedPackagesArg = args.find(
  (s) =>
    s.startsWith('--additional-packages=') ||
    s.startsWith('--additional-packages ')
) as string;
const userDefinedPackages = userDefinedPackagesArg
  ? userDefinedPackagesArg.slice(10).split(',')
  : null;
const isVerbose = args.some((s) => s === '--verbose');
// This is always "true" when running on Netlify
// See: https://docs.netlify.com/configure-builds/environment-variables/#build-metadata
const isNetlify = !!process.env.NETLIFY;
const isSlimInstall = args.some(
  (s) => s === '--slim-install' || s === '--slimInstall'
);
const headSha = 'HEAD';
const userDefinedRoot = customRoot ? customRoot.slice(7) : null;
let baseSha = customBase ? customBase.slice(7) : defaultBase || 'HEAD^';

if (!project) {
  console.log('≫ No project passed to nx-ignore script');
  process.exit(1);
}

main();

async function main() {
  const commitMessage = execSync(`git log -1 --pretty='%B'`).toString();

  if (commitHasSkipMessage(commitMessage)) {
    exitWithoutBuild(`🛑 - Skip build due to commit message: ${commitMessage}`);
  } else if (commitHasForceDeployMessage(commitMessage)) {
    exitWithBuild(`✅ - Forced build due to commit message: ${commitMessage}`);
  }

  const root = userDefinedRoot || process.cwd();
  console.log(
    `≫ Using Nx to determine if this project (${project}) is affected by the commit...`
  );

  logDebug(`≫ Running from ${__dirname}`);
  logDebug(`≫ Workspace root is ${root}`);

  const plugins = userDefinedPlugins ?? findThirdPartyPlugins(root);
  const nxVersion = ensureNxInstallation(root, plugins);

  if (!nxVersion) {
    console.log('≫ Cannot find installed Nx');
    process.exit(1);
  }

  logDebug(`≫ Found Nx at version ${nxVersion}`);

  // Disable daemon so we always generate new graph.
  process.env.NX_DAEMON = 'false';

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

  const graphJsonPath = join(tmpdir(), '.nx-affected-graph.json');
  try {
    const majorVersion = parseInt(nxVersion.match(/^(\d+)\./)?.[1] ?? '0');
    const cmd =
      majorVersion >= 19
        ? `npx nx graph --affected --base=${baseSha} --head=${headSha} --file=${graphJsonPath}${
            isVerbose ? ' --verbose' : ''
          }`
        : `npx nx affected:graph --base=${baseSha} --head=${headSha} --file=${graphJsonPath}${
            isVerbose ? ' --verbose' : ''
          }`;
    execSync(cmd, {
      cwd: root,
    });
  } catch (e: any) {
    if (e.stdout) console.error(e.stdout.toString());
    if (e.stderr) console.error(e.stderr.toString());
    exitWithoutBuild(
      `🛑 - Build cancelled due to the error above. You may need to use --additional-packages option if using Nx plugins to infer targets e.g. Project Crystal. (Hint: commit with "[nx deploy]" to force deployment if necessary)`
    );
  }
  const projects = JSON.parse(
    readFileSync(graphJsonPath).toString()
  ).affectedProjects;

  logDebug(`≫ Affected projects:\n  - ${projects.join('\n  - ')}\n`);

  // Clean up temporary node_modules that we installed Nx to.
  rmSync(join(root, 'node_modules'), { recursive: true, force: true });

  if (projects.includes(project)) {
    exitWithBuild(`✅ - Build can proceed since ${project} is affected`);
  } else {
    exitWithoutBuild(`🛑 - Build cancelled since ${project} is not affected`);
  }
}

function logDebug(s: string) {
  if (isVerbose) console.log(s);
}

function findThirdPartyPlugins(root: string): string[] {
  const nxJson = require(join(root, 'nx.json'));
  return (
    nxJson.plugins
      ?.map((p: any) => p.plugin ?? p)
      ?.filter((plugin: string) => !plugin.startsWith('.')) ?? []
  );
}

// This function ensures that Nx is installed in the workspace.
// Returns the version of Nx if found, null otherwise.
function ensureNxInstallation(root: string, plugins: string[]): string | null {
  // When plugins are used, we cannot reliably find all transient dependencies, thus we default to full installation.
  // This will make the install slower, so users can pass --slim-install to force a slim installation if it works for their repo.
  if (isNetlify) {
    logDebug(
      'Performing a slim installation of Nx because Netlify times out during full installation.'
    );
    return slimNxInstallation(root, plugins);
  } else if (plugins.length > 0 && !isSlimInstall) {
    logDebug(
      'Performing a full installation because Nx plugins are used. Override this behavior with `--slim-install`.'
    );
    return fullNxInstallation(root);
  } else {
    logDebug(`Performing a slim installation of Nx.`);
    return slimNxInstallation(root, plugins);
  }
}

function fullNxInstallation(root: string): string | null {
  const packageJson = require(join(root, 'package.json'));
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  if (
    existsSync(join(root, 'yarn.lock')) &&
    isPackageManagerInstalled(`yarn`)
  ) {
    logDebug(`Using yarn to install Nx.`);
    execSync(`yarn install`, { cwd: root });
  } else if (
    existsSync(join(root, 'pnpm-lock.yaml')) &&
    isPackageManagerInstalled(`pnpm`)
  ) {
    logDebug(`Using pnpm to install Nx.`);
    execSync(`pnpm install --force`, { cwd: root });
  } else {
    logDebug(`Using npm to install Nx.`);
    execSync(`npm install --force`, { cwd: root });
  }
  return deps['nx'] || null;
}

function slimNxInstallation(root: string, plugins: string[]): string | null {
  try {
    const packageJson = require(join(root, 'package.json'));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    const tmpPath = join(tmpdir(), '.nx-ignore');
    rmSync(join(root, 'node_modules'), { force: true, recursive: true });
    rmSync(tmpPath, { force: true, recursive: true });
    mkdirSync(tmpPath, { recursive: true });
    logDebug(`≫ Creating temp folder to install Nx: ${tmpPath}`);

    // create temp package.json to avoid install other packages
    const originalPackageJson = JSON.parse(
      readFileSync(join(root, 'package.json'))
    );
    const json: { name: string; dependencies: Record<string, string> } = {
      name: originalPackageJson.name,
      dependencies: detectRequiredPackages(root),
    };

    logDebug(`≫ Adding packages: ${Object.keys(json.dependencies).join(',')}`);

    plugins.forEach((plugin) => {
      // Normalize deep imports into the package to install (e.g. `@nx/next/plugin` into `@nx/next`)
      if (plugin.startsWith('@')) {
        plugin = plugin.split('/').slice(0, 2).join('/');
      } else {
        plugin = plugin.split('/')[0];
      }
      if (deps[plugin]) {
        json.dependencies[plugin] = deps[plugin];
        logDebug(`≫ Adding plugin ${plugin}@${deps[plugin]}`);
      } else {
        logDebug(
          `≫ Ignore plugin ${plugin} (workspace plugins do no need to be installed)`
        );
      }
    });
    // Plugins that extend the graph usually need devkit
    if (plugins.length > 0) {
      logDebug(`≫ Adding @nx/devkit`);
      json.dependencies['@nx/devkit'] = deps['nx'];
    }
    writeFileSync(join(tmpPath, 'package.json'), JSON.stringify(json));

    if (
      existsSync(join(root, 'yarn.lock')) &&
      isPackageManagerInstalled(`yarn`)
    ) {
      logDebug(`Using yarn to install Nx.`);
      execSync(`yarn install`, { cwd: tmpPath });
    } else if (
      existsSync(join(root, 'pnpm-lock.yaml')) &&
      isPackageManagerInstalled(`pnpm`)
    ) {
      logDebug(`Using pnpm to install Nx.`);
      execSync(`pnpm install --force`, { cwd: tmpPath });
    } else {
      logDebug(`Using npm to install Nx.`);
      execSync(`npm install --force`, { cwd: tmpPath });
    }
    moveSync(join(tmpPath, 'node_modules'), join(root, 'node_modules'));

    return deps['nx'];
  } catch (e) {
    logDebug(`Error: ${e}`);
    // nothing
  }

  return null;
}

function detectRequiredPackages(root: string): Record<string, string> {
  const knownPackagesUsedByConfigFilesForTargetInference = [
    /^nx$/,
    /@nx\//,
    /^typescript$/,
    /@typescript-eslint\//,
    /^@swc\//,
    /^@swc-node\//,
    /^cypress$/,
    /@cypress\//,
    /^cypress-/,
    /^eslint-/,
    /^enhanced-resolve$/,
    /^jest$/,
    /^jest-/,
    /-jest$/, // ts-jest, babel-jest
    /^next$/,
    /^nuxt$/,
    /@playwright\//,
    /@rollup\//,
    /^rollup-plugin-/,
    /^vite$/,
    /^vite-plugin-/,
    /@vitejs\//,
  ];
  const packages: Record<string, string> = {};
  const packageJson = require(join(root, 'package.json'));

  // Find common packages required by Nx plugins and their corresponding config files.
  // e.g. `@nx/playwright/plugin` reads `playwright.config.ts` which requires `@playwright/test`
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  for (const pkg of userDefinedPackages ?? []) {
    if (deps[pkg]) {
      packages[pkg] = deps[pkg];
    }
  }

  for (const pkg of Object.keys(deps)) {
    if (
      knownPackagesUsedByConfigFilesForTargetInference.some((r) => r.test(pkg))
    ) {
      packages[pkg] = deps[pkg];
    }
  }

  return packages;
}

function isPackageManagerInstalled(pm: 'yarn' | 'pnpm'): boolean {
  try {
    const version = execSync(`${pm} --version`, {
      stdio: 'pipe',
    })?.toString();
    logDebug(`Found ${pm} version ${version}.`);
    return true;
  } catch {
    logDebug(`Could not find ${pm}. Check that it is installed.`);
    return false;
  }
}

function commitHasSkipMessage(message: string): boolean {
  return [
    '[skip ci]',
    '[ci skip]',
    '[no ci]',
    '[nx skip]',
    `[nx skip ${project}]`,
  ].some((s) => message.includes(s));
}

function commitHasForceDeployMessage(message: string): boolean {
  return ['[nx deploy]', `[nx deploy ${project}`].some((s) =>
    message.includes(s)
  );
}

function exitWithoutBuild(message: string) {
  console.log(message);
  process.exit(0); // this tells Vercel to skip build
}

function exitWithBuild(message: string) {
  console.log(message);
  process.exit(1); // this tells Vercel to not ignore build.
}
