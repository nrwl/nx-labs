import {
  CreateNodesContext,
  CreateNodesFunction,
  CreateNodesV2,
  ProjectConfiguration,
  TargetConfiguration,
  createNodesFromFiles,
  getPackageManagerCommand,
  readJsonFile,
} from '@nx/devkit';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { toProjectName } from 'nx/src/config/to-project-name';
import { hashObject } from 'nx/src/hasher/file-hasher';
import { workspaceDataDirectory } from 'nx/src/utils/cache-directory';
import { ComposerJson } from '../../utils/model';

export interface LaravelPluginOptions {
  serveTargetName?: string;
  migrateTargetName?: string;
  migrateFreshTargetName?: string;
  tinkerTargetName?: string;
  queueWorkTargetName?: string;
  cacheClearTargetName?: string;
  routeListTargetName?: string;
}

export const createLaravelNode: CreateNodesFunction<
  LaravelPluginOptions
> = async (
  configFile: string,
  options: LaravelPluginOptions,
  context: CreateNodesContext
) => {
  const projectPath = dirname(configFile);

  if (!isLaravelProject(projectPath, context.workspaceRoot)) {
    return {};
  }

  const normalizedOptions = normalizeOptions(options ?? {});
  const pmc = getPackageManagerCommand();

  const project = await createProject(
    projectPath,
    normalizedOptions,
    context,
    pmc
  );

  return {
    projects: {
      [project.name]: project,
    },
  };
};

function isLaravelProject(projectPath: string, workspaceRoot: string): boolean {
  const absoluteProjectPath = join(workspaceRoot, projectPath);

  if (
    !existsSync(join(absoluteProjectPath, 'artisan')) ||
    !existsSync(join(absoluteProjectPath, 'composer.json'))
  ) {
    return false;
  }

  // Check for Laravel-specific directories
  const requiredPaths = [
    'bootstrap/app.php',
    'config/app.php',
    'routes/web.php',
  ];

  for (const path of requiredPaths) {
    if (!existsSync(join(absoluteProjectPath, path))) {
      return false;
    }
  }

  // Optional: Check composer.json for laravel/framework
  const composerPath = join(absoluteProjectPath, 'composer.json');
  if (existsSync(composerPath)) {
    try {
      const composer = readJsonFile(composerPath);
      const require = composer.require || {};
      const requireDev = composer['require-dev'] || {};
      const deps = { ...require, ...requireDev };
      // If composer.json exists and is readable, check for Laravel
      if (!deps['laravel/framework']) {
        return false;
      }
    } catch (e) {
      // If we can't read composer.json, continue - it might still be a Laravel project
    }
  }

  return true;
}

async function createProject(
  projectRoot: string,
  options: LaravelPluginOptions,
  context: CreateNodesContext,
  pmc: ReturnType<typeof getPackageManagerCommand>
): Promise<ProjectConfiguration & { name: string }> {
  const absoluteProjectPath = join(context.workspaceRoot, projectRoot);
  const projectName = projectRoot.split('/').pop();

  const targets: Record<string, TargetConfiguration> = {};

  targets[options.serveTargetName] = {
    command: 'php artisan serve',
    options: {
      cwd: projectRoot,
    },
    metadata: {
      technologies: ['php', 'laravel'],
      description: 'Start the Laravel development server',
      help: {
        command: 'php artisan serve --help',
        example: {
          options: {
            port: 8000,
            host: '127.0.0.1',
          },
        },
      },
    },
  };

  targets[options.migrateTargetName] = {
    command: 'php artisan migrate',
    options: {
      cwd: projectRoot,
    },
    dependsOn: ['^install'],
    metadata: {
      technologies: ['php', 'laravel'],
      description: 'Run the database migrations',
      help: {
        command: 'php artisan migrate --help',
        example: {
          options: {
            force: true,
            seed: true,
          },
        },
      },
    },
  };

  targets[options.migrateFreshTargetName] = {
    command: 'php artisan migrate:fresh --seed',
    options: {
      cwd: projectRoot,
    },
    dependsOn: ['^install'],
    metadata: {
      technologies: ['php', 'laravel'],
      description: 'Drop all tables and re-run all migrations with seeding',
      help: {
        command: 'php artisan migrate:fresh --help',
        example: {},
      },
    },
  };

  targets[options.tinkerTargetName] = {
    command: 'php artisan tinker',
    options: {
      cwd: projectRoot,
    },
    metadata: {
      technologies: ['php', 'laravel'],
      description: 'Interact with your application using Laravel Tinker REPL',
      help: {
        command: 'php artisan tinker --help',
        example: {},
      },
    },
  };

  targets[options.queueWorkTargetName] = {
    command: 'php artisan queue:work',
    options: {
      cwd: projectRoot,
    },
    metadata: {
      technologies: ['php', 'laravel'],
      description: 'Start processing jobs on the queue',
      help: {
        command: 'php artisan queue:work --help',
        example: {
          options: {
            queue: 'default',
            sleep: 3,
            tries: 3,
          },
        },
      },
    },
  };

  targets[options.cacheClearTargetName] = {
    command:
      'php artisan cache:clear && php artisan config:clear && php artisan route:clear && php artisan view:clear',
    options: {
      cwd: projectRoot,
    },
    metadata: {
      technologies: ['php', 'laravel'],
      description: 'Clear all Laravel caches',
      help: {
        command: 'php artisan cache:clear --help',
        example: {},
      },
    },
  };

  targets[options.routeListTargetName] = {
    command: 'php artisan route:list',
    options: {
      cwd: projectRoot,
    },
    metadata: {
      technologies: ['php', 'laravel'],
      description: 'List all registered routes',
      help: {
        command: 'php artisan route:list --help',
        example: {
          options: {
            path: 'api',
            method: 'GET',
          },
        },
      },
    },
  };

  // Add custom artisan commands from composer.json scripts
  const composerPath = join(absoluteProjectPath, 'composer.json');
  if (existsSync(composerPath)) {
    try {
      const composer = readJsonFile(composerPath);
      if (composer.scripts) {
        for (const [scriptName, scriptCommand] of Object.entries(
          composer.scripts
        )) {
          if (
            typeof scriptCommand === 'string' &&
            scriptCommand.includes('artisan')
          ) {
            const targetName = scriptName.replace(/:/g, '-');
            if (!targets[targetName]) {
              targets[targetName] = {
                command: scriptCommand,
                options: {
                  cwd: projectRoot,
                },
                metadata: {
                  technologies: ['php', 'laravel'],
                  description: `Custom artisan command: ${scriptName}`,
                },
              };
            }
          }
        }
      }
    } catch (e) {
      // Ignore errors reading composer.json
    }
  }

  const composerJson = readJsonFile<ComposerJson>(
    join(context.workspaceRoot, projectRoot, 'composer.json')
  );

  return {
    name: composerJson.name ?? toProjectName(projectRoot),
    root: projectRoot,
    projectType: 'application',
    targets,
  };
}

function normalizeOptions(
  options: LaravelPluginOptions
): Required<LaravelPluginOptions> {
  return {
    serveTargetName: options.serveTargetName ?? 'serve',
    migrateTargetName: options.migrateTargetName ?? 'migrate',
    migrateFreshTargetName: options.migrateFreshTargetName ?? 'migrate-fresh',
    tinkerTargetName: options.tinkerTargetName ?? 'tinker',
    queueWorkTargetName: options.queueWorkTargetName ?? 'queue-work',
    cacheClearTargetName: options.cacheClearTargetName ?? 'cache-clear',
    routeListTargetName: options.routeListTargetName ?? 'route-list',
  };
}

export const createNodesV2: CreateNodesV2<LaravelPluginOptions> = [
  '**/artisan',
  async (configFiles, options, context) => {
    const optionsHash = hashObject(options ?? {});
    const cachePath = join(
      workspaceDataDirectory,
      `laravel-${optionsHash}.hash`
    );

    return await createNodesFromFiles(
      createLaravelNode,
      configFiles,
      options,
      context
    );
  },
];
