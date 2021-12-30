import {
  detectPackageManager,
  formatFiles,
  getWorkspaceLayout,
  joinPathFragments,
  Tree,
  updateJson,
} from '@nrwl/devkit';

export default async function (
  tree: Tree,
  options: {
    packageManager?: 'yarn' | 'npm' | 'pnpm';
  }
) {
  const { libsDir } = getWorkspaceLayout(tree);
  const pm = options.packageManager ?? detectPackageManager();

  // Enable yarn/npm/pnpm workspaces for buildable libs
  if (pm !== 'pnpm') {
    updateJson(tree, 'package.json', (json) => {
      if (!json.workspaces) {
        json.workspaces ??= [joinPathFragments(libsDir, '*')];
      }
      return json;
    });
  } else {
    if (!tree.exists('pnpm-workspace.yaml')) {
      tree.write(
        'pnpm-workspace.yaml',
        `packages:
  - '${joinPathFragments(libsDir, '*')}'`
      );
    }
  }

  // Ignore nested project files
  let ignoreFile = tree.read('.gitignore').toString();
  if (ignoreFile.indexOf('/dist') !== -1) {
    ignoreFile = ignoreFile.replace('/dist', 'dist');
  }
  if (ignoreFile.indexOf('/node_modules') !== -1) {
    ignoreFile = ignoreFile.replace('/node_modules', 'node_modules');
  }
  if (ignoreFile.indexOf('# Remix files') === -1) {
    ignoreFile = `${ignoreFile
      .replace('/dist', 'dist')
      .replace('/node_modules', 'node_modules')}
# Remix files
apps/**/build
apps/**/.cache
  `;
  }
  tree.write('.gitignore', ignoreFile);

  updateJson(tree, 'nx.json', (json) => {
    if (Array.isArray(json.targetDependencies?.dev)) {
      if (
        !json.targetDependencies.dev.some(
          (x) => x.target === 'build' && x.projects === 'dependencies'
        )
      ) {
        json.targetDependencies.dev.push({
          target: 'build',
          projects: 'dependencies',
        });
      }
    } else {
      json.targetDependencies = {
        ...json.targetDependencies,
        dev: [{ target: 'build', projects: 'dependencies' }],
      };
    }
    return json;
  });

  await formatFiles(tree);

  return () => {
    // Reserved for additional processing needed
  };
}
