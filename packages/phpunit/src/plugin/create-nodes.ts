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
}

interface NormalizedOptions {
  targetName: string;
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
    // The lockfile is just used to parse out external dependencies, we'll create the projects from composer.json only.
    const siblingFiles = readdirSync(join(context.workspaceRoot, projectRoot));
    if (!siblingFiles.includes('composer.json')) {
      return {};
    }

    const normalizedOptions = normalizeOptions(options);
    const composerJson = readJsonFile<ComposerJson>(
      join(context.workspaceRoot, projectRoot, 'composer.json')
    );
    const hash = await calculateHashForCreateNodes(
      projectRoot,
      normalizedOptions,
      context
    );

    targetsCache[hash] ??= await buildTargets(
      composerJson,
      projectRoot,
      normalizedOptions,
      context
    );
    const { targets, metadata } = targetsCache[hash];

    return {
      projects: {
        [projectRoot]: {
          name: composerJson.name ?? toProjectName(projectRoot),
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
  projectRoot: string,
  options: NormalizedOptions,
  context: CreateNodesContext
): Promise<ComposerTargets> {
  const result: ComposerTargets = {
    targets: {},
    metadata: {},
  };
  if (
    composerJson['require']?.['phpunit/phpunit'] ||
    composerJson['require-dev']?.['phpunit/phpunit']
  ) {
    result.targets[options.targetName] = createPhpUnitTarget(
      `./vendor/bin/phpunit`,
      projectRoot,
      context
    );
  } else if (
    composerJson['require']?.['symfony/phpunit-bridge'] ||
    composerJson['require-dev']?.['symfony/phpunit-bridge']
  ) {
    result.targets[options.targetName] = createPhpUnitTarget(
      `./vendor/bin/simple-phpunit`,
      projectRoot,
      context
    );
  }
  return result;
}

function createPhpUnitTarget(
  command: string,
  projectRoot: string,
  context: CreateNodesContext
) {
  const namedInputs = getNamedInputs(projectRoot, context);
  return {
    command,
    cache: true,
    dependsOn: ['install', 'composer:install', 'composer-install'],
    inputs: getInputs(namedInputs),
    options: {
      cwd: projectRoot,
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
