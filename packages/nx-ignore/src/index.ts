#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync } = require('child_process');
const { tmpdir } = require('os');
const {
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
const vercelBase = process.env['VERCEL_GIT_PREVIOUS_SHA'];
const userDefinedPluginsArg = args.find(
  (s) => s.startsWith('--plugins=') || s.startsWith('--plugins ')
) as string;
const userDefinedPlugins = userDefinedPluginsArg
  ? userDefinedPluginsArg.slice(10).split(',')
  : null;
const isVerbose = args.some((s) => s === '--verbose');
const headSha = 'HEAD';
const userDefinedRoot = customRoot ? customRoot.slice(7) : null;
let baseSha = customBase ? customBase.slice(7) : vercelBase || 'HEAD^';

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
  const nxVersion = installTempNx(root, plugins);

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
  execSync(
    `npx nx affected:graph --base=${baseSha} --head=${headSha} --file=${graphJsonPath}`,
    {
      cwd: root,
    }
  );
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

function findThirdPartyPlugins(root: string) {
  const nxJson = require(join(root, 'nx.json'));
  return (
    nxJson.plugins?.filter((plugin: string) => !plugin.startsWith('.')) ?? []
  );
}

// This function ensures that Nx is installed in the workspace.
// Returns the version of Nx if found, null otherwise.
function installTempNx(root: string, plugins: string[]): string | null {
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
    const json = JSON.parse(readFileSync(join(root, 'package.json')));
    delete json['scripts'];
    delete json.devDependencies;
    json.dependencies = {
      nx: deps['nx'],
      typescript: deps['typescript'],
    };
    let devkitNeeded = false;
    plugins.forEach((plugin) => {
      if (deps[plugin]) {
        devkitNeeded = true;
        json.dependencies[plugin] = deps[plugin];
        logDebug(`≫ Adding plugin ${plugin}@${deps[plugin]}`);
      } else {
        logDebug(
          `≫ Ignore plugin ${plugin} (workspace plugins do no need to be installed)`
        );
      }
    });
    if (devkitNeeded) {
      json.dependencies['@nx/devkit'] = deps['nx'];
    }
    writeFileSync(join(tmpPath, 'package.json'), JSON.stringify(json));

    execSync(`npm install --force`, { cwd: tmpPath });
    moveSync(join(tmpPath, 'node_modules'), join(root, 'node_modules'));

    return deps['nx'];
  } catch {
    // nothing
  }

  return null;
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
