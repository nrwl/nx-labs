<p style="text-align: center;"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx.png" width="600" alt="Nx - Smart, Fast and Extensible Build System"></p>

<hr>

# Nx: Smart, Fast and Extensible Build System

Nx is a next generation build system with first class monorepo support and powerful integrations.

This package is a Bun plugin for Nx.

## Getting Started

Use `--preset=@nx/bun` when creating new workspace.

e.g.

```bash
npx create-nx-workspace@latest bun-demo --preset=@nx/bun
```

Now, you can go into the `bun-demo` folder and start development.

```bash
cd bun-demo
npm start
```

You can also run lint, test, and e2e scripts for the project.

```bash
npm run lint
npm run test
npm run e2e
```

## Existing workspaces

You can add Bun to any existing Nx workspace.

First, install the plugin:

```bash
npm install --save-dev @nx/bun
```

Then, run the `bun-project` generator:

```bash
npx nx g @nx/bun:bun-project --skipValidation
```

**Note:** The `--skipValidation` option allows you to overwrite existing build targets.

