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

## Adding new libraries

```bash
npx nx g @nrwl/remix:lib mylib
```

Importing in your app, and serve again.

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

## Contributing

### Running unit tests

Run `nx test nx-remix` to execute the unit tests via [Jest](https://jestjs.io).

### Publishing

```bash
nx publish nx-remix --ver=[version]
```
