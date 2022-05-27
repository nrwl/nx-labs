#!/usr/bin/env node
import * as cp from 'child_process';
import { findWorkspaceRoot } from 'nx/src/utils/find-workspace-root';

const project = process.argv[2];

if (!project) {
  console.log('≫ No project passed to nx-ignore script');
}

console.log(
  `≫ Using Nx to determine if this project (${project}) is affected by the commit...`
);

const root = findWorkspaceRoot(process.cwd());

if (!root) {
  console.log('≫ Could not find Nx root');
  process.exit(1);
}

main();

async function main() {
  // Since Nx currently looks for "nx" package under workspace root, the CLI doesn't work on Vercel.
  const { affected } = await import('nx/src/command-line/affected');
  let result = null;
  const _log = console.log;
  try {
    let output = '';
    console.log = (x) => {
      output = x;
    };
    await affected('print-affected', {
      _: '',
      base: 'HEAD^',
    } as any);
    result = JSON.parse(output);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    console.log = _log;
  }

  if (result.projects.includes(project)) {
    console.log(`≫ ✅ - Build can proceed since ${project} is affected`);
    process.exit(1); // this tells vercel to not ignore
  } else {
    console.log(`≫ 🛑 - Build cancelled since ${project} is not affected`);
  }
}
