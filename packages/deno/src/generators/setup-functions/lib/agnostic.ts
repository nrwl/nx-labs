import {
  joinPathFragments,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { assertNoTarget } from '../../utils/assertion';
import { DenoSetupServerlessSchema } from '../schema';

export function addAgnosticConfig(tree: Tree, opts: DenoSetupServerlessSchema) {
  const projectConfig = readProjectConfiguration(tree, opts.project);
  assertNoTarget(projectConfig, 'deploy');

  projectConfig.targets[opts.deployTarget] = {
    executor: 'nx:run-commands',
    options: {
      command: 'echo "TODO configure deploy target"',
    },
  };

  updateProjectConfiguration(tree, projectConfig.name, projectConfig);

  tree.write(
    joinPathFragments(projectConfig.root, 'functions', 'sample_fn.ts'),
    `export function sample() {
  console.log('hello world');
}
export default sample;
`
  );
}
