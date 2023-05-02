import {
  ensurePackage,
  joinPathFragments,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit';

import { version as nxVersion } from 'nx/package.json';

export default async function (tree: Tree, options: any) {
  const { cypressInitGenerator, cypressProjectGenerator } = ensurePackage(
    '@nrwl/cypress',
    nxVersion
  );

  const initSideEffects = await cypressInitGenerator(tree, {});
  const projSideEffects = await cypressProjectGenerator(tree, {
    ...options,
    standaloneConfig: true,
  });

  const config = readProjectConfiguration(tree, options.name);
  tree.delete(joinPathFragments(config.sourceRoot, 'support', 'app.po.ts'));
  tree.write(
    joinPathFragments(config.sourceRoot, 'e2e', 'app.cy.ts'),
    `describe('webapp', () => {
  beforeEach(() => cy.visit('/'));

  it('should display welcome message', () => {
    cy.get('h1').contains('Welcome to Remix');
  });
});`
  );

  const supportFilePath = joinPathFragments(
    config.sourceRoot,
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

  // returning this in case the cypress generator has any side effects
  return async () => {
    await initSideEffects();
    await projSideEffects();
  };
}
