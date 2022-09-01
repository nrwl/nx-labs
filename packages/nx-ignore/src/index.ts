#!/usr/bin/env node
import { findWorkspaceRoot } from 'nx/src/utils/find-workspace-root';

const args = process.argv.slice(2);
const project = args.find((s) => !s.startsWith('-')) as string;
const customBase = args.find((s) => s.startsWith('--base=')) as string;
const vercelBase = process.env['VERCEL_GIT_PREVIOUS_SHA'];
const isVerbose = args.some((s) => s === '--verbose');
const baseSha = customBase ? customBase.slice(7) : vercelBase || 'HEAD^';
const headSha = 'HEAD';

if (!project) {
  console.log('≫ No project passed to nx-ignore script');
  process.exit(1);
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
  let result = { projects: [] as string[] };

  logDebug(`\n≫ Comparing ${baseSha}...${headSha}\n`);

  // TODO(jack): This console.log hack isn't needed if Nx can support being installed outside of cwd.
  const _log = console.log;

  try {
    let output = '';
    console.log = (x) => {
      output = x;
    };

    await affected('print-affected', {
      _: '',
      base: baseSha,
      head: headSha,
    } as any);

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
