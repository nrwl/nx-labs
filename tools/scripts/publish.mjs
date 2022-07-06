import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import * as chalk from 'chalk';

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
writeFileSync(`package.json`, JSON.stringify(json, null, 2));

execSync(`npm publish --access public --tag ${tag}`);
