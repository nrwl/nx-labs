# @nrwl/aws-lambda

## Setup

Create a new Nx worksapce if you don't already have one.

```shell
npx create-nx-workspace@latest aws-lambda-demo --preset=@nrwl/aws-lambda:preset
```

Now, you can go into the `aws-lambda-demo` folder and start development.

**Note:** You must have [SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html#install-sam-cli-instructions) installed and `esbuild` available in your PATH before you start building / deploying your functions.


You can do this by running

```shell
npm install -g esbuild
```

Now to run your functions locally you can

```shell
cd aws-lambda-demo
npx nx run dev
```

You can also run lint, test and deploy for the project.

```shell
npx nx run lint
npx nx run test
npx nx run deploy
```

For `deploy` this runs

```shell
sam deploy --guided
```

**Note:** Change `aws-lambda-demo` to any project name you want.

## Existing workspaces

You can add aws-lambda to any existing Nx workspace.

First, install the plugin:

```bash
npm install -DE @nrwl/aws-lambda@latest
```

## Create a new Aws Lambda App

```shell
npx nx g @nrwl/aws-lambda:serverless
```
