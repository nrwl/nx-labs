import { cypressProjectGenerator } from '@nrwl/cypress';
import { Tree } from '@nrwl/devkit';
import { Linter } from '@nrwl/linter';
import { NormalizedSchema } from './normalize-options';

export async function addCypress(host: Tree, options: NormalizedSchema) {
  if (options?.e2eTestRunner !== 'cypress') {
    return () => void 0;
  }

  return cypressProjectGenerator(host, {
    ...options,
    linter: Linter.EsLint,
    name: `${options.name}-e2e`,
    directory: options.directory,
    project: options.projectName,
  });
}
