import { readJsonFile, workspaceRoot } from '@nx/devkit';
import * as path from 'path';

function onCreateBabelConfig({ actions }, options) {
  const tsConfig = readJsonFile(path.join(workspaceRoot, 'tsconfig.base.json'));
  const tsConfigPaths: { [key: string]: Array<string> } =
    tsConfig.compilerOptions.paths;

  const paths = Object.entries(tsConfigPaths).reduce((result, [key, paths]) => {
    return {
      ...result,
      [key]: paths.map((p) => path.join(workspaceRoot, p)),
    };
  }, {});

  actions.setBabelPlugin({
    name: require.resolve(`babel-plugin-module-resolver`),
    options: {
      root: ['./src'],
      alias: paths,
    },
  });
}

export { onCreateBabelConfig };
