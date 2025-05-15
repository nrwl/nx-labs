import {
  type CreateNodesContext,
  createNodesFromFiles,
  type CreateNodesFunction,
  type CreateNodesV2,
  type ProjectConfiguration,
  readJsonFile,
  type TargetConfiguration,
  writeJsonFile,
} from '@nx/devkit';
import { calculateHashForCreateNodes } from '@nx/devkit/src/utils/calculate-hash-for-create-nodes';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { toProjectName } from 'nx/src/config/to-project-name';
import { hashObject } from 'nx/src/hasher/file-hasher';
import { workspaceDataDirectory } from 'nx/src/utils/cache-directory';

export interface ComposerJson {
  name: string;
  description?: string;
  type?: string;
  require?: Record<string, string>;
  'require-dev'?: Record<string, string>;
  autoload?: Record<string, unknown>;
  'autoload-dev'?: Record<string, unknown>;
  scripts?: Record<string, string | string[]>;
  'scripts-descriptions'?: Record<string, string>;
  extra?: {
    nx?: {
      targets?: Record<string, TargetConfiguration>;
    };
  };
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ComposerPluginOptions {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
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
      context,
      ['composer.json', 'composer.lock']
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

  if (composerJson.scripts) {
    for (const [name, commands] of Object.entries(composerJson.scripts)) {
      result.targets[name] = {
        executor: 'nx:run-commands',
        options: {
          command: commands,
          cwd: projectRoot,
        },
        metadata: {
          technologies: ['composer'],
          description: composerJson['scripts-descriptions']?.[name],
        },
      };
    }
  }

  if (composerJson.extra?.nx?.targets) {
    for (const [name, config] of Object.entries(
      composerJson.extra.nx.targets
    )) {
      result.targets[name] = {
        ...result.targets[name],
        ...config,
      };
    }
  }

  return result;
}

function normalizeOptions(options: ComposerPluginOptions): NormalizedOptions {
  return {
    ...options,
  };
}
