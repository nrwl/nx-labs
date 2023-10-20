import { cypressProjectGenerator } from '@nx/cypress';
import { Tree } from '@nx/devkit';
import { Linter } from '@nx/eslint';
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
