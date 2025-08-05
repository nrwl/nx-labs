import {
  addDependenciesToPackageJson,
  formatFiles,
  GeneratorCallback,
  logger,
  readNxJson,
  runTasksInSerial,
  Tree,
  updateNxJson,
  type NxJsonConfiguration,
} from '@nx/devkit';
import { addMavenPlugin } from './maven-plugin-utils';
import { InitGeneratorSchema } from './schema';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nxVersion = require('../../../package.json').version;

export async function initGenerator(
  tree: Tree,
  options: InitGeneratorSchema
): Promise<GeneratorCallback> {
  const tasks: GeneratorCallback[] = [];

  // 1. Add package.json dependencies if not skipped
  if (!options.skipPackageJson && tree.exists('package.json')) {
    const installTask = addDependenciesToPackageJson(
      tree,
      {},
      {
        '@nx/maven': nxVersion,
      },
      undefined,
      options.keepExistingVersions
    );
    tasks.push(installTask);
  }

  // 2. Add Maven plugin configuration
  await addMavenPlugin(tree);

  // 3. Add plugin to nx.json and update configuration
  addPluginAndUpdateConfiguration(tree, options);

  // 5. Format files if not skipped
  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

function addPluginAndUpdateConfiguration(
  tree: Tree,
  options: InitGeneratorSchema
) {
  const nxJson = readNxJson(tree);

  if (!nxJson) {
    logger.warn('Unable to find nx.json. Creating a basic configuration.');
    // Create a basic nx.json if it doesn't exist
    const basicNxJson = {
      namedInputs: {},
      targetDefaults: {},
      plugins: [],
    };
    tree.write('nx.json', JSON.stringify(basicNxJson, null, 2));
    return addPluginAndUpdateConfiguration(tree, options);
  }

  let modified = false;

  // Add the plugin if not already present
  if (!hasMavenPlugin(nxJson)) {
    nxJson.plugins ??= [];
    nxJson.plugins.push({
      plugin: '@nx/maven',
      options: {
        mavenExecutable: options.mavenExecutable || 'mvn',
      },
    });
    modified = true;
    logger.info('Added Maven plugin to nx.json');
  } else {
    logger.info('Maven plugin already configured in nx.json');
  }

  // Add Maven-specific named inputs
  nxJson.namedInputs ??= {};
  if (!nxJson.namedInputs.maven) {
    nxJson.namedInputs.maven = [
      '{projectRoot}/pom.xml',
      '{projectRoot}/src/**/*',
      '{workspaceRoot}/pom.xml',
    ];
    modified = true;
  }

  // Add Maven-specific target defaults
  nxJson.targetDefaults ??= {};

  if (!nxJson.targetDefaults.compile) {
    nxJson.targetDefaults.compile = {
      dependsOn: ['^compile'],
      inputs: ['maven'],
    };
    modified = true;
  }

  if (!nxJson.targetDefaults.test) {
    nxJson.targetDefaults.test = {
      dependsOn: ['^compile'],
      inputs: ['maven'],
    };
    modified = true;
  }

  if (!nxJson.targetDefaults.package) {
    nxJson.targetDefaults.package = {
      dependsOn: ['^package'],
      inputs: ['maven'],
    };
    modified = true;
  }

  // Only update if we made changes
  if (modified) {
    updateNxJson(tree, nxJson);
    logger.info('Updated nx.json configuration for Maven');
  }
}

function hasMavenPlugin(nxJson: NxJsonConfiguration): boolean {
  if (!nxJson.plugins) {
    return false;
  }

  return nxJson.plugins.some((plugin) => {
    if (typeof plugin === 'string') {
      return plugin === '@nx/maven';
    }
    return 'plugin' in plugin && plugin.plugin === '@nx/maven';
  });
}

export default initGenerator;
