import { Tree } from '@nx/devkit';

// TODO(caleb): switch to @nx/js version once we update and make it a dep
export function getRootTsConfigPathInTree(tree: Tree): string | null {
  for (const path of ['tsconfig.base.json', 'tsconfig.json']) {
    if (tree.exists(path)) {
      return path;
    }
  }

  return 'tsconfig.base.json';
}
export interface TsConfigPaths {
  compilerOptions: { paths?: Record<string, string[]>; baseUrl?: string };
}
