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

export interface ComposerPluginOptions {
  installTargetName?: string | false;
  updateTargetName?: string | false;
}

interface NormalizedOptions {
  installTargetName: string | false;
  updateTargetName: string | false;
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
      const deps = {
        ...composerJson['require'],
        ...composerJson['require-dev'],
      };
      for (const dep of Object.keys(deps)) {
        const versions = packageVersions.get(dep) ?? [];
        // We don't know what the version will resolve as yet without the lockfile.
        // We still want to collect the dependency since many repos don't commit their lockfile,
        // and it'll be impossible to collect external deps without doing this.
        versions.push('*');
        packageVersions.set(dep, versions);
      }
    } else {
      // Add the version to the package map (there may be multiple versions of the same package)
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
      const key =
        // If the version is collected as '*' from composer.json, create the name as version-agnostic
        // This doesn't affect the existing PHP/composer support, but opens the possibility to make affected logic smarter.
        version === '*' ? `packagist:${name}` : `packagist:${name}@${version}`;
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
    for (const [name, _commands] of Object.entries(composerJson.scripts)) {
      result.targets[name] = {
        command: `composer ${name}`,
        options: {
          cwd: projectRoot,
        },
        metadata: {
          technologies: ['composer'],
          description: composerJson['scripts-descriptions']?.[name],
        },
      };
    }
  }

  if (options.installTargetName !== false) {
    result.targets[options.installTargetName] = {
      command: 'composer install',
      options: {
        cwd: projectRoot,
      },
    };
  }
  if (options.updateTargetName !== false) {
    result.targets[options.updateTargetName] = {
      command: 'composer update',
      options: {
        cwd: projectRoot,
      },
    };
  }

  return result;
}

function normalizeOptions(options: ComposerPluginOptions): NormalizedOptions {
  options.installTargetName ??= 'install';
  options.updateTargetName ??= 'update';
  return options as NormalizedOptions;
}
