import * as chalk from 'chalk';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

let [, , name, version, tag] = process.argv;
const validVersion = /^\d+\.\d+\.\d(-\w+\.\d+)?/;

if (!version || !validVersion.test(version)) {
  console.error(chalk.red(`Invalid version`));
  process.exit(1);
}

tag = tag || 'next';

process.chdir(`dist/packages/${name}`);

const json = JSON.parse(readFileSync(`package.json`).toString());
json.version = version;

// TODO: Revisit this to make it better
for (const deps of [json.dependencies, json.devDependencies, json.peerDependencies, json.optionalDependencies]) {
  for (const [ dep, depVersion] of Object.entries(deps ?? {})) {
    if (depVersion === '*' || depVersion.startsWith('file:')) {
      deps[dep] = version;
    }
  }
}

writeFileSync(`package.json`, JSON.stringify(json, null, 2));

// USAGE example: NPM_OTP=381781 node tools/scripts/publish.mjs remix 15.8.5 latest
execSync(
  `npm publish --access public --tag ${tag} --otp ${process.env.NPM_OTP}`
);
