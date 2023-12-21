# @nx/netlify

> ⚠️ The Netlify plugin is deprecated and will no longer receive updates. We are committed to providing high-quality tooling to community, and we no longer have the capacity to keep this plugin updated.

## Setup

Create a new Nx worksapce if you don't already have one.

```shell
npx create-nx-workspace@latest netlify-demo --preset=@nx/netlify:preset
```

Now, you can go into the `netlify-demo` folder and start development.

Now to run your functions locally you can use:

```shell
cd netlify-demo
npx nx dev
```

To deploy to Netlify, run:

```shell
npx nx deploy
```

This command will prompt you to setup the project the first time you deploy.

## Create a new Netlify Serverless App

```shell
npx nx g @nx/netlify:serverless
```
