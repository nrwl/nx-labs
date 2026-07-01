/**
 * This script starts a local registry for e2e testing purposes.
 * It is meant to be called in jest's globalSetup.
 */

/// <reference path="registry.d.ts" />

import { startLocalRegistry } from '@nx/js/plugins/jest/local-registry';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { releasePublish, releaseVersion } from 'nx/release';

export default async () => {
  // local registry target to run
  const localRegistryTarget = 'nx-labs:local-registry';
  // storage folder for the local registry
  const storage = './tmp/local-registry/storage';
  const userConfig = join(process.cwd(), 'tmp/local-registry/.npmrc');

  mkdirSync(join(process.cwd(), 'tmp/local-registry'), { recursive: true });
  process.env.npm_config_userconfig = userConfig;
  process.env.NPM_CONFIG_USERCONFIG = userConfig;

  global.stopLocalRegistry = await startLocalRegistry({
    localRegistryTarget,
    storage,
    verbose: false,
  });

  await releaseVersion({
    specifier: '0.0.0-e2e',
    stageChanges: false,
    gitCommit: false,
    gitTag: false,
    firstRelease: true,
    versionActionsOptionsOverrides: {
      skipLockFileUpdate: true,
    },
  });
  await releasePublish({
    tag: 'e2e',
    firstRelease: true,
  });
};
