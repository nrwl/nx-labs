import { CreateNodesContext } from '@nx/devkit';
import { createLaravelNode } from './create-nodes';
import { join } from 'path';

jest.mock('node:fs', () => ({
  ...jest.requireActual('node:fs'),
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
}));

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  readJsonFile: jest.fn(),
  getPackageManagerCommand: jest.fn(() => ({
    exec: 'npm',
    run: 'npm run',
    install: 'npm install',
  })),
  getNamedInputs: jest.fn(() => ({})),
}));

import { existsSync } from 'node:fs';
import { readJsonFile } from '@nx/devkit';

describe('Laravel Plugin', () => {
  let context: CreateNodesContext;

  beforeEach(() => {
    context = {
      workspaceRoot: '/root',
      nxJsonConfiguration: {},
      configFiles: [],
    };
    jest.clearAllMocks();
  });

  describe('createLaravelNode', () => {
    it('should create nodes for Laravel projects', async () => {
      const configFile = 'apps/my-app/artisan';
      
      (existsSync as jest.Mock).mockImplementation((path: string) => {
        // The paths will include workspace root, so check with includes
        if (path.includes('apps/my-app/artisan')) return true;
        if (path.includes('apps/my-app/bootstrap/app.php')) return true;
        if (path.includes('apps/my-app/config/app.php')) return true;
        if (path.includes('apps/my-app/routes/web.php')) return true;
        if (path.includes('apps/my-app/composer.json')) return true;
        return false;
      });

      (readJsonFile as jest.Mock).mockReturnValue({
        require: {
          'laravel/framework': '^10.0',
        },
        scripts: {
          'test': 'phpunit',
          'test:unit': 'php artisan test --testsuite=Unit',
          'test:feature': 'php artisan test --testsuite=Feature',
        },
      });

      const result = await createLaravelNode(configFile, {}, context);

      expect(result.projects).toBeDefined();
      expect(result.projects['my-app']).toBeDefined();
      
      const project = result.projects['my-app'];
      expect(project.root).toBe('apps/my-app');
      expect(project.projectType).toBe('application');
      
      // Check standard targets
      expect(project.targets.serve).toBeDefined();
      expect(project.targets.migrate).toBeDefined();
      expect(project.targets['migrate-fresh']).toBeDefined();
      expect(project.targets.tinker).toBeDefined();
      expect(project.targets['queue-work']).toBeDefined();
      expect(project.targets['cache-clear']).toBeDefined();
      expect(project.targets['route-list']).toBeDefined();
      
      // Check custom artisan commands from composer.json
      expect(project.targets['test-unit']).toBeDefined();
      expect(project.targets['test-feature']).toBeDefined();
      
      // Verify target properties
      expect(project.targets.serve.command).toBe('php artisan serve');
      expect(project.targets.serve.metadata.technologies).toContain('laravel');
      expect(project.targets.migrate.dependsOn).toContain('^install');
    });

    it('should not create nodes for non-Laravel projects', async () => {
      const configFile = 'apps/my-app/artisan';
      
      (existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.endsWith('artisan')) return true;
        // Missing Laravel-specific files
        return false;
      });

      const result = await createLaravelNode(configFile, {}, context);

      expect(result).toEqual({});
      expect(result.projects).toBeUndefined();
    });

    it('should respect custom target names', async () => {
      const configFile = 'apps/my-app/artisan';
      
      (existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('apps/my-app/artisan')) return true;
        if (path.includes('apps/my-app/bootstrap/app.php')) return true;
        if (path.includes('apps/my-app/config/app.php')) return true;
        if (path.includes('apps/my-app/routes/web.php')) return true;
        if (path.includes('apps/my-app/composer.json')) return true;
        return false;
      });

      (readJsonFile as jest.Mock).mockReturnValue({
        require: {
          'laravel/framework': '^10.0',
        },
      });

      const options = {
        serveTargetName: 'dev-server',
        migrateTargetName: 'db-migrate',
      };

      const result = await createLaravelNode(configFile, options, context);

      const project = result.projects['my-app'];
      expect(project.targets['dev-server']).toBeDefined();
      expect(project.targets['db-migrate']).toBeDefined();
      expect(project.targets.serve).toBeUndefined();
      expect(project.targets.migrate).toBeUndefined();
    });

    it('should handle projects without composer.json', async () => {
      const configFile = 'apps/my-app/artisan';
      
      (existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('apps/my-app/artisan')) return true;
        if (path.includes('apps/my-app/bootstrap/app.php')) return true;
        if (path.includes('apps/my-app/config/app.php')) return true;
        if (path.includes('apps/my-app/routes/web.php')) return true;
        if (path.includes('apps/my-app/composer.json')) return false; // No composer.json
        return false;
      });

      const result = await createLaravelNode(configFile, {}, context);

      expect(result.projects).toBeDefined();
      expect(result.projects['my-app']).toBeDefined();
      
      const project = result.projects['my-app'];
      expect(project.targets.serve).toBeDefined();
    });

    it('should handle composer.json read errors gracefully', async () => {
      const configFile = 'apps/my-app/artisan';
      
      (existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('apps/my-app/artisan')) return true;
        if (path.includes('apps/my-app/bootstrap/app.php')) return true;
        if (path.includes('apps/my-app/config/app.php')) return true;
        if (path.includes('apps/my-app/routes/web.php')) return true;
        if (path.includes('apps/my-app/composer.json')) return true;
        return false;
      });

      (readJsonFile as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid JSON');
      });

      const result = await createLaravelNode(configFile, {}, context);

      expect(result.projects).toBeDefined();
      expect(result.projects['my-app']).toBeDefined();
    });
  });
});