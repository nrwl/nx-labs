import {
  addDependenciesToPackageJson,
  joinPathFragments,
  Tree,
  updateJson,
} from '@nx/devkit';
import { Linter, lintProjectGenerator } from '@nx/linter';
import { createReactEslintJson, extraEslintDependencies } from '@nx/react';
import { runTasksInSerial } from '@nx/workspace/src/utilities/run-tasks-in-serial';
import type { Linter as ESLintLinter } from 'eslint';
import { NormalizedSchema } from './normalize-options';

export async function addLinting(host: Tree, options: NormalizedSchema) {
  const lintTask = await lintProjectGenerator(host, {
    linter: Linter.EsLint,
    project: options.projectName,
    tsConfigPaths: [
      joinPathFragments(options.projectRoot, 'tsconfig.app.json'),
    ],
    eslintFilePatterns: [`${options.projectRoot}/**/*.{ts,tsx,js,jsx}`],
    skipFormat: true,
  });

  const reactEslintJson = createReactEslintJson(
    options.projectRoot,
    options.setParserOptionsProject
  );

  updateJson(
    host,
    joinPathFragments(options.projectRoot, '.eslintrc.json'),
    (json: ESLintLinter.Config) => {
      json = reactEslintJson;
      json.ignorePatterns = ['!**/*', 'public', '.cache'];

      for (const override of json.overrides) {
        if (!override.files || override.files.length !== 2) {
          continue;
        }
        if (
          !(override.files.includes('*.ts') && override.files.includes('*.tsx'))
        ) {
          continue;
        }
        override.rules = override.rules || {};
        override.rules['@typescript-eslint/camelcase'] = 'off';
      }

      return json;
    }
  );

  const installTask = await addDependenciesToPackageJson(
    host,
    extraEslintDependencies.dependencies,
    extraEslintDependencies.devDependencies
  );

  return runTasksInSerial(lintTask, installTask);
}
