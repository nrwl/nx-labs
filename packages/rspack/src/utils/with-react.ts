import { Configuration } from '@rspack/core';
import { SharedConfigContext } from './model';
import { withWeb } from './with-web';
import ReactRefreshPlugin from "@rspack/plugin-react-refresh";

export function withReact(opts = {}) {
  return function makeConfig(
    config: Configuration,
    { options, context }: SharedConfigContext
  ): Configuration {
    const isDev =
      process.env.NODE_ENV === 'development' || options.mode === 'development';

    config = withWeb({ ...opts, cssModules: true })(config, {
      options,
      context,
    });

    const react = {
      runtime: 'automatic',
      development: isDev,
      refresh: isDev,
    };

    return {
      ...config,
      plugins: [
        ...(config.plugins || []),
        new ReactRefreshPlugin(),
      ],
      module: {
        ...config.module,
        rules: [
          ...(config.module.rules || []),
          {
            test: /\.jsx$/,
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'ecmascript',
                  jsx: true,
                },
                transform: {
                  react,
                },
              },
            },
            type: 'javascript/auto',
          },
          {
            test: /\.tsx$/,
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                transform: {
                  react,
                },
              },
            },
            type: 'javascript/auto',
          },
        ],
      },
    };
  };
}
