<p style="text-align: center;"><img src="https://github.com/nrwl/nx-labs/raw/main/packages/remix/nx-remix.png" width="600" alt="Nx - Smart, Fast and Extensible Build System"></p>

Next generation full stack framework and build system together. Build better websites with [Remix](https://remix.run/) and [Nx](https://nx.dev).

Nx makes supercharges your builds, and the optional [Nx Cloud](https://nx.app) provide out-of-the-box distributed caching, distributed task execution, and valuable workspace insights.

## Creating new Remix workspace

Use `--preset=@nx/remix` when creating new workspace.

e.g.

```bash
npx create-nx-workspace@latest acme \
--preset=@nx/remix \
--project=demo
```

Now, you can go into the `acme` folder and start development.

```bash
cd acme
npx nx dev demo
```

**Note:** This command runs the `dev` script in `apps/demo/package.json`.

Start the production server with one command.

```bash
npx nx start demo
```

**Note:** This will run the build before starting (as defined in `nx.json`).

## Existing workspaces

You can add Remix to any existing Nx workspace.

First, install the plugin:

```bash
npm install --save-dev @nx/remix

# Or with yarn
yarn add -D @nx/remix
```

Then, run the setup generator:

```bash
npx nx g @nx/remix:setup
```

You can then add your first app and run it:

```bash
npx nx g @nx/remix:app demo
```

## Adding new routes

Add a new route with one command.

```bash
npx nx g route

# e.g.
npx nx g route foo/bar --project=demo
```

Browse to `http://localhost:3000/foo/bar` to see the new route.

## Workspace libraries

The Remix setup leverages npm/yarn/pnpm workspaces and Nx buildable libraries.

```bash
npx nx g @nx/remix:lib mylib
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

Run `nx test demo` to execute the unit tests via [Jest](https://jestjs.io).

### Publishing

```bash
nx publish demo --ver=[version]
```
