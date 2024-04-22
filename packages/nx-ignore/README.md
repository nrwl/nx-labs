# nx-ignore

This package is used on platforms such as Netlify or Vercel to ignore builds if a project is not affected.

## Usage

```bash
npx nx-ignore <project-name>
```

For Netlify, use a [custom ignore command](https://docs.netlify.com/configure-builds/ignore-builds/) in your `netlify.toml` file.

For Vercel, under the `Settings > Git` section, use this script in `Ignored Build Step` field.

### Options

- `--base` - Set a custom base SHA to compare changes (defaults to `CACHED_COMMIT_REF` on Netlify or `VERCEL_GIT_PREVIOUS_SHA` on Vercel)
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
