import {
  type CreateNodesContext,
  createNodesFromFiles,
  type CreateNodesFunction,
  type CreateNodesV2,
  type NxJsonConfiguration,
  type ProjectConfiguration,
  readJsonFile,
  type TargetConfiguration,
  writeJsonFile,
} from '@nx/devkit';
import { calculateHashForCreateNodes } from '@nx/devkit/src/utils/calculate-hash-for-create-nodes';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { getNamedInputs } from '@nx/devkit/src/utils/get-named-inputs';
import { toProjectName } from 'nx/src/config/to-project-name';
import { hashObject } from 'nx/src/hasher/file-hasher';
import { workspaceDataDirectory } from 'nx/src/utils/cache-directory';
import { ComposerJson } from '../utils/model';

export interface ComposerPluginOptions {
  targetName?: string;
  testCommand?: string;
}

interface NormalizedOptions {
  targetName: string;
  testCommand?: string;
}

type ComposerTargets = Pick<ProjectConfiguration, 'targets' | 'metadata'>;

function readTargetsCache(cachePath: string): Record<string, ComposerTargets> {
  return existsSync(cachePath) ? readJsonFile(cachePath) : {};
}

function writeTargetsToCache(
  cachePath: string,
  results: Record<string, ComposerTargets>
) {
  writeJsonFile(cachePath, results);
}

const composerJsonGlob = '**/phpunit.xml{,.dist}';

export const createNodesV2: CreateNodesV2<ComposerPluginOptions> = [
  composerJsonGlob,
  async (configFilePaths, options, context) => {
    const optionsHash = hashObject(options ?? {});
    const cachePath = join(
      workspaceDataDirectory,
      `phpunit-${optionsHash}.hash`
    );
    const targetsCache = readTargetsCache(cachePath);
    try {
      return await createNodesFromFiles(
        makeCreateNodesFromComposerJson(targetsCache),
        configFilePaths,
        options,
        context
      );
    } finally {
      writeTargetsToCache(cachePath, targetsCache);
    }
  },
];

function makeCreateNodesFromComposerJson(
  targetsCache: Record<string, ComposerTargets>
): CreateNodesFunction {
  return async (
    configFilePath: string,
    options: ComposerPluginOptions,
    context: CreateNodesContext
  ) => {
    const projectRoot = dirname(configFilePath);
    const normalizedOptions = normalizeOptions(options);

    let projectName: string;
    let useRootComposerJson = false;

    // The lockfile is just used to parse out external dependencies, we'll create the projects from composer.json only.
    const siblingFiles = readdirSync(join(context.workspaceRoot, projectRoot));
    if (
      !siblingFiles.includes('composer.json') &&
      !siblingFiles.includes('project.json')
    ) {
      return {};
    }

    // If `project.json` does not provide the name, we have to read it from `composer.json` or else graph creation fails.
    if (existsSync(join(context.workspaceRoot, projectRoot, 'composer.json'))) {
      const composerJson = readJsonFile<ComposerJson>(
        join(context.workspaceRoot, projectRoot, 'composer.json')
      );
      projectName = composerJson.name ?? toProjectName(projectRoot);
      useRootComposerJson = true;
    }

    let composerJson = readJsonFile<ComposerJson>(
      useRootComposerJson
        ? join(context.workspaceRoot, 'composer.json')
        : join(context.workspaceRoot, projectRoot, 'composer.json')
    );
    let testPkg = getTestPackageName(composerJson);
    if (!useRootComposerJson && !testPkg) {
      useRootComposerJson = true;
      composerJson = readJsonFile<ComposerJson>(
        join(context.workspaceRoot, 'composer.json')
      );
      testPkg = getTestPackageName(composerJson);
    }
    if (!testPkg) {
      return {};
    }

    const hash = await calculateHashForCreateNodes(
      projectRoot,
      normalizedOptions,
      context
    );

    targetsCache[hash] ??= await buildTargets(
      composerJson,
      useRootComposerJson,
      testPkg,
      projectRoot,
      normalizedOptions,
      context
    );
    const { targets, metadata } = targetsCache[hash];

    return {
      projects: {
        [projectRoot]: {
          name: projectName,
          root: projectRoot,
          targets,
          metadata,
        },
      },
    };
  };
}

async function buildTargets(
  composerJson: ComposerJson,
  isRootComposerJson: boolean,
  testPkg: string,
  projectRoot: string,
  options: NormalizedOptions,
  context: CreateNodesContext
): Promise<ComposerTargets> {
  const result: ComposerTargets = {
    targets: {},
    metadata: {},
  };
  if (options.testCommand) {
    result.targets[options.targetName] = createPhpUnitTarget(
      isRootComposerJson
        ? `${options.testCommand} ${projectRoot}`
        : options.testCommand,
      projectRoot,
      isRootComposerJson ? '.' : projectRoot,
      context
    );
  } else if (testPkg === 'phpunit/phpunit') {
    result.targets[options.targetName] = createPhpUnitTarget(
      isRootComposerJson
        ? `/vendor/bin/phpunit ${projectRoot}`
        : `./vendor/bin/phpunit`,
      projectRoot,
      isRootComposerJson ? '.' : projectRoot,
      context
    );
  } else if (testPkg === 'symfony/phpunit-bridge') {
    result.targets[options.targetName] = createPhpUnitTarget(
      isRootComposerJson
        ? `./vendor/bin/simple-phpunit ${projectRoot}`
        : `./vendor/bin/simple-phpunit`,
      projectRoot,
      isRootComposerJson ? '.' : projectRoot,
      context
    );
  }
  return result;
}

function getTestPackageName(composerJson: ComposerJson): string | null {
  for (const pkg of ['phpunit/phpunit', 'symfony/phpunit-bridge']) {
    if (composerJson['require']?.[pkg] || composerJson['require-dev']?.[pkg]) {
      return pkg;
    }
  }
  return null;
}

function createPhpUnitTarget(
  command: string,
  projectRoot: string,
  cwd: string,
  context: CreateNodesContext
) {
  const namedInputs = getNamedInputs(projectRoot, context);
  return {
    command,
    cache: true,
    dependsOn: ['install', 'composer:install', 'composer-install'],
    inputs: getInputs(namedInputs),
    options: {
      cwd,
    },
    metadata: {
      technologies: ['phpunit'],
      description: 'Runs PHPUnit Tests',
      help: {
        command: `${command} --help`,
        example: {
          options: {
            colors: 'auto',
          },
        },
      },
    },
  };
}

function normalizeOptions(options: ComposerPluginOptions): NormalizedOptions {
  options.targetName ??= 'test';
  return options as NormalizedOptions;
}

function getInputs(
  namedInputs: NxJsonConfiguration['namedInputs']
): TargetConfiguration['inputs'] {
  return [
    ...('production' in namedInputs
      ? ['default', '^production']
      : ['default', '^default']),
  ];
}
