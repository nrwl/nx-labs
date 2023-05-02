import { jestProjectGenerator } from '@nrwl/jest';
import { Tree, updateJson } from '@nx/devkit';
import { NormalizedSchema } from './normalize-options';

export async function addJest(host: Tree, options: NormalizedSchema) {
  if (options?.unitTestRunner !== 'jest') {
    return () => void 0;
  }

  const installTask = await jestProjectGenerator(host, {
    project: options.projectName,
    supportTsx: true,
    skipSerializers: true,
    setupFile: 'none',
    compiler: 'babel',
    js: options.js,
  });

  updateJson(host, `${options.projectRoot}/tsconfig.spec.json`, (json) => {
    json.compilerOptions.jsx = 'react';
    return json;
  });

  return installTask;
}
