<p style="text-align: center;"><img src="https://github.com/nrwl/nx-labs/raw/main/packages/nx-remix/nx-remix.png" width="600" alt="Nx - Smart, Fast and Extensible Build System"></p>

## Creating new workspace

```bash
npx create-nx-workspace@latest acme --preset=@nrwl/remix --project=demo
```

Now, you can go into the `acme` folder and start development.

```bash
cd acme
npx nx dev demo
```

**Note:** This command runs the `dev` script in `apps/demo/package.json`.

You can also run `nx build demo` and `nx start demo`.

## Adding new libraries

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
        <Mylib/>
        <Outlet />
      </Layout>
    </Document>
  );
}
```

Now, build and run install.

```bash
npx nx build mylib
yarn

# or with npm workspaces
npm install -ws
```

Finally, serve the app again.

```bash
npx nx dev demo
```

## Contributing

### Running unit tests

Run `nx test nx-remix` to execute the unit tests via [Jest](https://jestjs.io).

### Publishing

```bash
nx publish nx-remix --ver=[version]
```
