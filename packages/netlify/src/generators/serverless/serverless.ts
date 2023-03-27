import {
  extractLayoutDirectory,
  GeneratorCallback,
  names,
  Tree,
} from '@nrwl/devkit';
import { Linter } from '@nrwl/linter';
import { applicationGenerator } from '@nrwl/node';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import setupServerlessGenerator from '../setup-serverless/setup-serverless';
import { Schema } from './schema';

function normalizeOptions(options: Schema): Schema {
  const { projectDirectory } = extractLayoutDirectory(options.directory);
  const appDirectory = projectDirectory
    ? `${names(projectDirectory).fileName}/${names(options.name).fileName}`
    : names(options.name).fileName;

  const appProjectName = appDirectory.replace(new RegExp('/', 'g'), '-');
  return {
    ...options,
    name: names(appProjectName).fileName,
    lintTarget: options.lintTarget ?? 'lint',
    linter: options.linter ?? Linter.EsLint,
    unitTestRunner: options.unitTestRunner ?? 'jest',
  };
}

export async function serverlessGenerator(tree: Tree, schema: Schema) {
  const options = normalizeOptions(schema);
  const tasks: GeneratorCallback[] = [];

  const init = await applicationGenerator(tree, {
    ...options,
    framework: 'none',
    e2eTestRunner: 'none',
    rootProject: true,
  });

  tasks.push(init);

  const addServerlessTask = await setupServerlessGenerator(tree, {
    ...options,
    project: options.name,
  });

  tasks.push(addServerlessTask);

  return runTasksInSerial(...tasks);
}
