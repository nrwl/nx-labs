import {
  ensurePackage,
  GeneratorCallback,
  joinPathFragments,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';

import { version as nxVersion } from 'nx/package.json';
import { CypressGeneratorSchema } from './schema';

export default async function (
  tree: Tree,
  options: CypressGeneratorSchema
): Promise<GeneratorCallback> {
  options.baseUrl ??= 'http://localhost:3000';
  const { cypressInitGenerator, cypressProjectGenerator } = ensurePackage(
    '@nx/cypress',
    nxVersion
  );

  const initSideEffects = await cypressInitGenerator(tree, {});
  const projSideEffects = await cypressProjectGenerator(tree, {
    ...options,
    standaloneConfig: true,
  });

  const projectConfig = readProjectConfiguration(tree, options.name);
  tree.delete(
    joinPathFragments(projectConfig.sourceRoot, 'support', 'app.po.ts')
  );
  tree.write(
    joinPathFragments(projectConfig.sourceRoot, 'e2e', 'app.cy.ts'),
    `describe('webapp', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    cy.get('h1').contains('Welcome to Remix');
  });
});`
  );

  const supportFilePath = joinPathFragments(
    projectConfig.sourceRoot,
    'support',
    'e2e.ts'
  );
  const supportContent = tree.read(supportFilePath, 'utf-8');

  tree.write(
    supportFilePath,
    `${supportContent}

// from https://github.com/remix-run/indie-stack
Cypress.on("uncaught:exception", (err) => {
  // Cypress and React Hydrating the document don't get along
  // for some unknown reason. Hopefully we figure out why eventually
  // so we can remove this.
  if (
    /hydrat/i.test(err.message) ||
    /Minified React error #418/.test(err.message) ||
    /Minified React error #423/.test(err.message)
  ) {
    return false;
  }
});`
  );

  // run-commands won't emit { success: true, baseUrl: '...' } to Cypress executor.
  // We'll wire it up manually and skip serve from Cypress.
  projectConfig.targets.e2e.options.skipServe = true;
  projectConfig.targets.e2e.options.baseUrl =
    options.baseUrl ?? 'http://localhost:3000';
  projectConfig.targets.e2e.dependsOn = ['dev-server'];
  delete projectConfig.targets.e2e.options.devServerTarget;
  delete projectConfig.targets.e2e?.configurations?.production.devServerTarget;
  projectConfig.targets['dev-server'] = {
    command: `nx serve ${options.project}`,
    options: {
      readyWhen: 'Server started',
    },
    configurations: {
      production: {
        command: `nx serve ${options.project} --configuration=production`,
      },
    },
  };
  updateProjectConfiguration(tree, options.name, projectConfig);

  // returning this in case the cypress generator has any side effects
  return async () => {
    await initSideEffects();
    await projSideEffects();
  };
}
