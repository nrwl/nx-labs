import { workspaceLayout, workspaceRoot } from '@nrwl/devkit';
import { join } from 'path';
import { getResolveRequest } from './metro-resolver';

interface WithNxOptions {
  debug?: boolean;
  extensions?: string[];
}

export function withNxMetro(config: any, opts: WithNxOptions = {}) {
  const extensions = ['', 'ts', 'tsx', 'js', 'jsx', 'json'];
  if (opts.debug) process.env.NX_REACT_NATIVE_DEBUG = 'true';
  if (opts.extensions) extensions.push(...opts.extensions);

  config.projectRoot = __dirname;

  const watchFolders = config.watchFolders || [];
  config.watchFolders = watchFolders.concat([
    join(workspaceRoot, 'node_modules'),
    join(workspaceRoot, workspaceLayout().libsDir),
  ]);

  // Add support for paths specified by tsconfig
  config.resolver = {
    ...config.resolver,
    resolveRequest: getResolveRequest(extensions),
  };

  return config;
}
