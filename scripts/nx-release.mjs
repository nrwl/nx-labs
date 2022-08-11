#!/usr/bin/env node
import yargsParser from 'yargs-parser';
import releaseIt from 'release-it';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const parsedArgs = yargsParser(process.argv, {
  boolean: ['dry-run', 'local'],
  alias: {
    d: 'dry-run',
    h: 'help',
    l: 'local',
  },
});

console.log('parsedArgs', parsedArgs);

if (!parsedArgs.local && !process.env.GITHUB_TOKEN_RELEASE_IT_NX) {
  console.error('process.env.GITHUB_TOKEN_RELEASE_IT_NX is not set');
  process.exit(1);
}

if (parsedArgs.help) {
  console.log(`
      Usage: yarn nx-release <version> [options]

      Example: "yarn nx-release 1.0.0-beta.1"

      The acceptable format for the version number is:
      {number}.{number}.{number}[-{alpha|beta|rc}.{number}]

      The subsection of the version number in []s is optional, and, if used, will be used to
      mark the release as "prerelease" on GitHub, and tag it with "next" on npm.

      Options:
        --dry-run           Do not touch or write anything, but show the commands
        --help              Show this message
        --local             Publish to local npm registry (IMPORTANT: install & run Verdaccio first & set registry in .npmrc)

    `);
  process.exit(0);
}

if (!parsedArgs.local) {
  console.log('> git fetch --all');
  childProcess.execSync('git fetch --all', {
    stdio: [0, 1, 2],
  });
}

function updatePackageJsonFiles(parsedVersion, isLocal) {
  let pkgFiles = [
    'package.json',
    'dist/npm/expo/package.json',
    'dist/npm/remix/package.json',
  ];
  if (isLocal) {
    pkgFiles = pkgFiles.filter((f) => f !== 'package.json');
  }
  pkgFiles.forEach((p) => {
    const content = JSON.parse(fs.readFileSync(p).toString());
    content.version = parsedVersion.version;
    fs.writeFileSync(p, JSON.stringify(content, null, 2));
  });
}

function parseVersion(version) {
  if (!version || !version.length) {
    return {
      version,
      isValid: false,
      isPrerelease: false,
    };
  }
  const sections = version.split('-');
  if (sections.length === 1) {
    /**
     * Not a prerelease version, validate matches exactly the
     * standard {number}.{number}.{number} format
     */
    return {
      version,
      isValid: !!sections[0].match(/\d+\.\d+\.\d+$/),
      isPrerelease: false,
    };
  }
  /**
   * Is a prerelease version, validate each section
   * 1. {number}.{number}.{number} format
   * 2. {alpha|beta|rc}.{number}
   */
  return {
    version,
    isValid: !!(
      sections[0].match(/\d+\.\d+\.\d+$/) &&
      sections[1].match(/(alpha|beta|rc)\.\d+$/)
    ),
    isPrerelease: true,
  };
}

const parsedVersion = parseVersion(parsedArgs._[2]);
if (!parsedVersion.isValid) {
  console.error(
    `\nError:\nThe specified version is not valid. You specified: "${parsedVersion.version}"`
  );
  console.error(
    `Please run "yarn nx-release --help" for details on the acceptable version format.\n`
  );
  process.exit(1);
} else {
  console.log('parsed version: ', JSON.stringify(parsedVersion));
}

const { devDependencies } = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'))
);
const cliVersion = devDependencies['@angular/cli'];
const typescriptVersion = devDependencies['typescript'];
const prettierVersion = devDependencies['prettier'];

console.log('Executing build script:');
const buildCommand = `./scripts/package.sh ${parsedVersion.version} ${cliVersion} ${typescriptVersion} ${prettierVersion}`;
console.log(`> ${buildCommand}`);
childProcess.execSync(buildCommand, {
  stdio: [0, 1, 2],
});

/**
 * Create working directory and copy over built packages
 */
childProcess.execSync('rm -rf dist/npm && mkdir -p dist/npm', {
  stdio: [0, 1, 2],
});
childProcess.execSync('cp -R dist/packages/* dist/npm', {
  stdio: [0, 1, 2],
});
/**
 * Get rid of tarballs at top of copied directory (made with npm pack)
 */
childProcess.execSync(`find dist/npm -maxdepth 1 -name "*.tgz" -delete`, {
  stdio: [0, 1, 2],
});

/**
 * Setting this to true can be useful for development/testing purposes.
 * No git commands, nor npm publish commands will be run when this is
 * true.
 */
const DRY_RUN = !!parsedArgs['dry-run'];

process.env.GITHUB_TOKEN = !parsedArgs.local
  ? process.env.GITHUB_TOKEN_RELEASE_IT_NX
  : 'dummy-gh-token';
/**
 * Set the static options for release-it
 */
const options = {
  'dry-run': DRY_RUN,
  /**
   * Needed so that we can leverage conventional-changelog to generate
   * the changelog
   */
  safeBump: false,
  increment: parsedVersion.version,
  requireUpstream: false,
  github: {
    preRelease: parsedVersion.isPrerelease,
    release: true,
  },
  npm: false,
  git: {
    requireCleanWorkingDir: false,
    changelog: 'conventional-changelog -p angular | tail -n +3',
  },
};

updatePackageJsonFiles(parsedVersion, parsedArgs.local);
if (parsedArgs.local) {
  childProcess.execSync(
    `./scripts/publish.sh ${parsedVersion.version} latest --local`,
    {
      stdio: [0, 1, 2],
    }
  );
  process.exit(0);
} else {
  releaseIt(options)
    .then((output) => {
      if (DRY_RUN) {
        console.warn(
          'WARNING: In DRY_RUN mode - not running publishing script'
        );
        process.exit(0);
        return;
      }
      const npmTag = parsedVersion.isPrerelease ? 'next' : 'latest';
      const npmPublishCommand = `./scripts/publish.sh ${output.version} ${npmTag}`;
      console.log('Executing publishing script for all packages:');
      console.log(`> ${npmPublishCommand}`);
      console.log(
        `Note: You will need to authenticate with your NPM credentials`
      );
      childProcess.execSync(npmPublishCommand, {
        stdio: [0, 1, 2],
      });
      process.exit(0);
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
