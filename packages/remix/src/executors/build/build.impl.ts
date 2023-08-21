import { logger, writeJsonFile, type ExecutorContext } from '@nx/devkit';
import { createLockFile, createPackageJson, getLockFileName } from '@nx/js';
import { directoryExists } from '@nx/workspace/src/utilities/fileutils';
import { cli as remixCli } from '@remix-run/dev';
import { copySync, mkdir, writeFileSync } from 'fs-extra';
import { type PackageJson } from 'nx/src/utils/package-json';
import { join } from 'path';
import { type RemixBuildSchema } from './schema';

export default async function buildExecutor(
  options: RemixBuildSchema,
  context: ExecutorContext
) {
  const projectRoot = context.projectGraph.nodes[context.projectName].data.root;

  try {
    await remixCli.run(['build', projectRoot]);
  } catch (error) {
    logger.error(`Error occurred while trying to build application.`);
    logger.error(error.toString());
    return { success: false };
  }

  if (!directoryExists(options.outputPath)) {
    mkdir(options.outputPath);
  }

  const builtPackageJson = createPackageJson(
    context.projectName,
    context.projectGraph,
    {
      target: context.targetName,
      root: context.root,
      isProduction: !options.includeDevDependenciesInPackageJson, // By default we remove devDependencies since this is a production build.
    }
  );

  // Update `package.json` to reflect how users should run the build artifacts
  builtPackageJson.scripts = {
    start: 'remix-serve build',
  };

  updatePackageJson(builtPackageJson, context);
  writeJsonFile(`${options.outputPath}/package.json`, builtPackageJson);

  if (options.generateLockfile) {
    const lockFile = createLockFile(builtPackageJson);
    writeFileSync(`${options.outputPath}/${getLockFileName()}`, lockFile, {
      encoding: 'utf-8',
    });
  }

  // If output path is different from source path, then copy over the config and public files.
  // This is the default behavior when running `nx build <app>`.
  if (options.outputPath.replace(/\/$/, '') !== projectRoot) {
    copySync(join(projectRoot, 'public'), join(options.outputPath, 'public'), {
      dereference: true,
    });
    copySync(join(projectRoot, 'build'), join(options.outputPath, 'build'), {
      dereference: true,
    });
  }

  return { success: true };
}

function updatePackageJson(packageJson: PackageJson, context: ExecutorContext) {
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  if (!packageJson.scripts.start) {
    packageJson.scripts.start = 'remix-serve build';
  }

  packageJson.dependencies ??= {};

  // These are always required for a production Remix app to run.
  const requiredPackages = [
    'react',
    'react-dom',
    'isbot',
    'typescript',
    '@remix-run/css-bundle',
    '@remix-run/node',
    '@remix-run/react',
    '@remix-run/serve',
    '@remix-run/dev',
  ];
  for (const pkg of requiredPackages) {
    const externalNode = context.projectGraph.externalNodes[`npm:${pkg}`];
    if (externalNode) {
      packageJson.dependencies[pkg] ??= externalNode.data.version;
    }
  }
}
