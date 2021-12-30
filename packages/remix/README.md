<p style="text-align: center;"><img src="https://github.com/nrwl/nx-labs/raw/main/packages/remix/remix.png" width="600" alt="Nx - Smart, Fast and Extensible Build System"></p>

Next generation full stack framework and build system together. Build better websites with [Remix](https://remix.run/) and [Nx](https://nx.dev).

Nx makes supercharges your builds, and the optional [Nx Cloud](https://nx.app) provide out-of-the-box distributed caching, distributed task execution, and valuable workspace insights.

## Creating new Remix workspace

Use `--project=@nrwl/remix` when creating new workspace.

e.g.

```bash
npx create-nx-workspace@latest acme \
--preset=@nrwl/remix \
--project=demo
```

Now, you can go into the `acme` folder and start development.

```bash
cd acme
npx nx dev demo
```

**Note:** This command runs the `dev` script in `apps/demo/package.json`.

You can also run `nx build demo` and `nx start demo`.

## Existing workspaces

You can add Remix to any existing Nx workspace.

First, install the plugin:

```bash
npm install --save-dev @nrwl/remix

# Or with yarn
yarn add -D @nrwl/remix
```

Then, run the setup generator:

```bash
npx nx g @nrwl/remix:setup
```

You can then add your first app and run it:

```bash
npx nx g @nrwl/remix:app demo
```

## Workspace libraries

The Remix setup leverages npm/yarn/pnpm workspaces and Nx buildable libraries.

```bash
npx nx g @nrwl/remix:lib mylib
```

Import the new library in your app.

```typescript jsx
// apps/demo/app/root.tsx
import { Mylib } from '@acme/mylib';

// ...

export default function App() {
  return (
    <Document>
      <Layout>
        <Mylib />
        <Outlet />
      </Layout>
    </Document>
  );
}
```

Now, run the dev server again to see the new library in action.

```bash
npx nx dev demo
```

**Note:** You must restart the server if you make any changes to your library. Luckily, with Nx cache this operation should be super fast.

## Contributing

### Running unit tests

Run `nx test remix` to execute the unit tests via [Jest](https://jestjs.io).

### Publishing

```bash
nx publish remix --ver=[version]
```
