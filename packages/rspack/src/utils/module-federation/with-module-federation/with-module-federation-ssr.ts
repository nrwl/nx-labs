import { DefinePlugin } from '@rspack/core';
import {
  ModuleFederationConfig,
  NxModuleFederationConfigOverride,
} from '../models';
import { getModuleFederationConfig } from './utils';

export async function withModuleFederationForSSR(
  options: ModuleFederationConfig,
  configOverride?: NxModuleFederationConfigOverride
) {
  if (global.NX_GRAPH_CREATION) {
    return (config) => config;
  }

  const { sharedLibraries, sharedDependencies, mappedRemotes } =
    await getModuleFederationConfig(options, {
      isServer: true,
    });

  return (config) => {
    config.target = false;
    config.output.uniqueName = options.name;
    config.optimization = {
      ...(config.optimization ?? {}),
      runtimeChunk: false,
    };

    config.plugins.push(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      new (require('@module-federation/node').UniversalFederationPlugin)(
        {
          name: options.name,
          filename: 'remoteEntry.js',
          exposes: options.exposes,
          remotes: mappedRemotes,
          shared: {
            ...sharedDependencies,
          },
          library: {
            type: 'commonjs-module',
          },
          isServer: true,
          /**
           * Apply user-defined config overrides
           */
          ...(configOverride ? configOverride : {}),
          runtimePlugins:
            process.env.NX_MF_DEV_REMOTES &&
            !options.disableNxRuntimeLibraryControlPlugin
              ? [
                  ...(configOverride?.runtimePlugins ?? []),
                  require.resolve(
                    '@nx/rspack/src/utils/module-federation/plugins/runtime-library-control.plugin.js'
                  ),
                ]
              : configOverride?.runtimePlugins,
        },
        {}
      ),
      sharedLibraries.getReplacementPlugin()
    );

    // The env var is only set from the module-federation-dev-server
    // Attach the runtime plugin
    config.plugins.push(
      new DefinePlugin({
        'process.env.NX_MF_DEV_REMOTES': process.env.NX_MF_DEV_REMOTES,
      })
    );

    return config;
  };
}
