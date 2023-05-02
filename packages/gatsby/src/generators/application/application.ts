import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { convertNxGenerator, formatFiles, Tree } from '@nx/devkit';

import { addStyleDependencies } from '../../utils/styles';
import { gatsbyInitGenerator } from '../init/init';
import { addCypress } from './lib/add-cypress';
import { addGitIgnoreEntry } from './lib/add-git-ignore-entry';
import { addJest } from './lib/add-jest';
import { addLinting } from './lib/add-linting';
import { addPrettierIgnoreEntry } from './lib/add-prettier-ignore-entry';
import { addProject } from './lib/add-project';
import { createApplicationFiles } from './lib/create-application-files';
import { normalizeOptions } from './lib/normalize-options';
import { setDefaults } from './lib/set-defaults';
import { updateJestConfig } from './lib/update-jest-config';
import { Schema } from './schema';

export async function applicationGenerator(host: Tree, schema: Schema) {
  const options = normalizeOptions(host, schema);

  const initTask = await gatsbyInitGenerator(host, {
    ...options,
    skipFormat: true,
  });

  createApplicationFiles(host, options);
  addProject(host, options);
  const styledTask = addStyleDependencies(host, options.style);
  const lintTask = await addLinting(host, options);
  const cypressTask = await addCypress(host, options);
  const jestTask = await addJest(host, options);
  updateJestConfig(host, options);
  addPrettierIgnoreEntry(host, options);
  addGitIgnoreEntry(host, options);

  setDefaults(host, options);
  await formatFiles(host);

  return runTasksInSerial(
    initTask,
    styledTask,
    lintTask,
    cypressTask,
    jestTask
  );
}

export default applicationGenerator;
export const applicationSchematic = convertNxGenerator(applicationGenerator);
