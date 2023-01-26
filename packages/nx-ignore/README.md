# nx-ignore

This package is used on Vercel to ignore builds if a project is not affected.

## Usage

In the `Settings > Git` section on Vercel, use this script as `Ignored Build Step`.

```bash
npx nx-ignore <project-name>
```

<p style="text-align: center;"><img src="https://github.com/nrwl/nx-labs/raw/main/packages/nx-ignore/vercel.png" width="600" alt="Nx - Smart, Fast and Extensible Build System"></p>

### Options

- `--base` - Set a custom base SHA to compare changes (defaults to [`VERCEL_GIT_PREVIOUS_SHA`](https://vercel.com/docs/concepts/projects/environment-variables#system-environment-variables)).
- `--plugins` - List of Nx plugins required (i.e. plugins that extend the Nx graph). Default plugins are read from nx.json.
- `--root` - Set a custom workspace root (defaults to current working directory).
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

The `nx-ignore` command uses Nx to determine whether the current commit affects the specified app. It exits with an error code (1) when the app is affected, which tells Vercel to continue the build, otherwise it exits successfully, which tells Vercel to cancel the build.
