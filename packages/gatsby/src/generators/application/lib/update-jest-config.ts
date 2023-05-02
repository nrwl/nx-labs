import { Tree } from '@nx/devkit';
import { updateJestConfigContent } from '@nx/react/src/utils/jest-utils';
import { NormalizedSchema } from './normalize-options';

export function updateJestConfig(host: Tree, options: NormalizedSchema) {
  if (options.unitTestRunner !== 'jest') {
    return;
  }

  const configPath = `${options.projectRoot}/jest.config.${
    options.js ? 'js' : 'ts'
  }`;
  const originalContent = host.read(configPath, 'utf-8');
  const content = updateJestConfigContent(originalContent);
  host.write(configPath, content);
}
