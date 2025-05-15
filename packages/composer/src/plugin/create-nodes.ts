import {
  type CreateNodesContext,
  createNodesFromFiles,
  type CreateNodesFunction,
  type CreateNodesV2,
  type ProjectConfiguration,
  type ProjectGraphExternalNode,
  readJsonFile,
  writeJsonFile,
} from '@nx/devkit';
import { calculateHashForCreateNodes } from '@nx/devkit/src/utils/calculate-hash-for-create-nodes';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { toProjectName } from 'nx/src/config/to-project-name';
import { hashObject } from 'nx/src/hasher/file-hasher';
import { workspaceDataDirectory } from 'nx/src/utils/cache-directory';
import { ComposerJson, ComposerLock } from '../utils/model';

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

const composerJsonGlob = '**/composer.{json,lock}';

function calculateExternalNodes(
  configFilePaths: readonly string[]
): Record<string, ProjectGraphExternalNode> {
  const result: Record<string, ProjectGraphExternalNode> = {};
  const componentNames = new Set<string>();
  const packageVersions = new Map<string, string[]>();
  for (const configFilePath of configFilePaths) {
    // composer.json tells use it is a workspace project, and we can filter them out from external packages
    if (configFilePath.endsWith('.json')) {
      const composerJson = readJsonFile<ComposerJson>(configFilePath);
      if (composerJson.name) {
        componentNames.add(composerJson.name);
      }
    } else {
      // add the version to the package map (there may be multiple versions of the same package)
      const composerLock = readJsonFile<ComposerLock>(configFilePath);
      if (composerLock.packages) {
        for (const pkg of composerLock.packages) {
          if (!pkg.name) continue;
          const versions = packageVersions.get(pkg.name) ?? [];
          versions.push(pkg.version);
          packageVersions.set(pkg.name, versions);
        }
      }
    }
  }
  for (const [name, versions] of packageVersions.entries()) {
    if (componentNames.has(name)) continue;
    for (const version of versions) {
      const key = result[name]
        ? `packagist:${name}@${version}`
        : `packagist:${name}`;
      result[key] = {
        type: 'packagist',
        name: key,
        data: {
          packageName: name,
          version,
        },
      };
    }
  }
  return result;
}

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
        makeCreateNodesFromComposerJson(
          targetsCache,
          calculateExternalNodes(configFilePaths)
        ),
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
  targetsCache: Record<string, ComposerTargets>,
  externalNodes: Record<string, ProjectGraphExternalNode>
): CreateNodesFunction {
  return async (
    configFilePath: string,
    options: ComposerPluginOptions,
    context: CreateNodesContext
  ) => {
    const projectRoot = dirname(configFilePath);

    // The lockfile is just used to parse out external dependencies, we'll create the projects from composer.json only.
    if (configFilePath.endsWith('.lock')) return {};

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
      externalNodes,
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
    const allScriptNames = new Set(Object.keys(composerJson.scripts));
    for (const [name, _commands] of Object.entries(composerJson.scripts)) {
      const commands = calculateCommands(_commands, allScriptNames);
      result.targets[name] = {
        executor: 'nx:run-commands',
        options: {
          commands,
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

/**
 *  If the command starts with "@" it can be a command or a script. If it's a script, then we need to run it through Nx since it matches a target.
 */
function calculateCommands(
  commands: string | string[],
  allScriptNames: Set<string>
): string[] {
  const result: string[] = [];
  if (typeof commands === 'string') {
    collectCommands(commands, allScriptNames, result);
  } else {
    for (const command of commands) {
      collectCommands(command, allScriptNames, result);
    }
  }
  return result;
}

function collectCommands(
  command: string,
  allScriptNames: Set<string>,
  collectedCommands = [] as string[]
): void {
  if (!command.startsWith('@')) {
    collectedCommands.push(command);
    return;
  }
  const rest = command.slice(1);
  if (allScriptNames.has(rest)) {
    collectedCommands.push(`nx ${rest}`);
  } else {
    collectedCommands.push(rest);
  }
}
