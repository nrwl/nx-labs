import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import {
  CreateNodesContext,
  createNodesFromFiles,
  CreateNodesV2,
  ProjectConfiguration,
  readJsonFile,
  writeJsonFile,
} from '@nx/devkit';
import { calculateHashForCreateNodes } from '@nx/devkit/src/utils/calculate-hash-for-create-nodes';

import { hashObject } from 'nx/src/hasher/file-hasher';
import { workspaceDataDirectory } from 'nx/src/utils/cache-directory';

interface ComposerPluginOptions {}

interface NormalizedOptions {}

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

const composerJsonGlob = '**/composer.json';
export const createNodesV2: CreateNodesV2<ComposerPluginOptions> = [
  composerJsonGlob,
  async (configFilePaths, options, context) => {
    const optionsHash = hashObject(options ?? {});
    const cachePath = join(
      workspaceDataDirectory,
      `composer-${optionsHash}.hash`
    );
    const targetsCache = readTargetsCache(cachePath);
    try {
      return await createNodesFromFiles(
        (configFile, options, context) =>
          createNodesInternal(configFile, options ?? {}, context, targetsCache),
        configFilePaths,
        options,
        context
      );
    } finally {
      writeTargetsToCache(cachePath, targetsCache);
    }
  },
];

async function createNodesInternal(
  configFilePath: string,
  options: ComposerPluginOptions,
  context: CreateNodesContext,
  targetsCache: Record<string, ComposerTargets>
) {
  const projectRoot = dirname(configFilePath);

  const siblingFiles = readdirSync(join(context.workspaceRoot, projectRoot));
  if (!siblingFiles.includes('composer.json')) {
    return {};
  }

  const normalizedOptions = normalizeOptions(options);
  const composerJson = JSON.parse(
    readFileSync(
      join(context.workspaceRoot, projectRoot, 'composer.json')
    ).toString()
  );
  const hash = await calculateHashForCreateNodes(
    projectRoot,
    normalizedOptions,
    context,
    ['composer.json']
  );

  targetsCache[hash] ??= await buildTargets(
    configFilePath,
    projectRoot,
    normalizedOptions,
    context
  );
  const { targets, metadata } = targetsCache[hash];

  return {
    projects: {
      [projectRoot]: {
        name: composerJson.name,
        root: projectRoot,
        targets,
        metadata,
      },
    },
  };
}

async function buildTargets(
  configFilePath: string,
  projectRoot: string,
  options: NormalizedOptions,
  context: CreateNodesContext
): Promise<ComposerTargets> {
  return {
    targets: {},
    metadata: {},
  };
}

function normalizeOptions(options: ComposerPluginOptions): NormalizedOptions {
  return {
    ...options,
  };
}
