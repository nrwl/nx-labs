# nx-ignore

This package is used on platforms such as Netlify or Vercel to ignore builds if a project is not affected.

## Usage

```bash
npx nx-ignore <project-name>
```

For Netlify, use a [custom ignore command](https://docs.netlify.com/configure-builds/ignore-builds/) in your `netlify.toml` file.

For Vercel, under the `Settings > Git` section, use this script in `Ignored Build Step` field.

### Options

- `--additional-packages` - List of additional npm packages to install when using `--slim-install`. Use this for packages required in configuration files that infer Nx targets (e.g. `@playwright/test`). Defaults to a list of known packages required by Nx and Nx plugins.
- `--base` - Set a custom base SHA to compare changes (defaults to `CACHED_COMMIT_REF` on Netlify or `VERCEL_GIT_PREVIOUS_SHA` on Vercel).
- `--plugins` - List of Nx plugins required (i.e. plugins that extend the Nx graph). Default plugins are read from nx.json.
- `--root` - Set a custom workspace root (defaults to current working directory).
- `--slim-install` - Install only Nx and necessary plugins to speed up the script (defaults to true when not using plugin, and false when plugins are used).
- `--verbose` - Log more details information for debugging purposes.

### Skipping and forcing deployment

Skip nx-ignore check and ignore deployment:

- [skip ci]
- [ci skip]
- [no ci]
- [nx skip <app>]

Skip nx-ignore check and force deployment:

- [nx deploy]
- [nx deploy <app>]

## How it works

The `nx-ignore` command uses Nx to determine whether the current commit affects the specified app. It exits with an error code (1) when the app is affected, which tells the platform to continue the build, otherwise it exits successfully, which tells the platform to cancel the build.

## Troubleshooting

### Error `Failed to process project graph` occurs on Netlify

When `plugins` are used in `nx.json`, Nx infers projects and targets through those plugins via their corresponding configuration files. For example, `@nx/next/plugin` infers projects and targets from `next.config.js` files. This means that modules imported in `next.config.js` must be present in order for Nx to work correctly.

If you run into the `Failed to process project graph` error, it means that some of the packages are missing. To debug what packages are missing, run `npx nx-ignore@latest <app> --verbose --slim-install` locally, and you should see an error with the missing package. You can also run `npx nx show projects` to debug any missing packages, after running the `npx nx-ignore` command.

Use the `--additional-packages` option to install the missing packages as detected above. For example,

```
npx nx-ignore@latest <app> --verbose --slim-install --additional-packages=@playwright/test,jest-environment-jsdom
```
