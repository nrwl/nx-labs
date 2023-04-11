import {
  joinPathFragments,
  readProjectConfiguration,
  Tree,
} from '@nrwl/devkit';

import { cypressProjectGenerator, cypressInitGenerator } from '@nrwl/cypress';

export default async function (tree: Tree, options: any) {
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
    cy.get('h2').contains('Welcome to Remix!');
  });
});`
  );
  // returning this in case the cypress generator has any side effects
  return async () => {
    await initSideEffects;
    await projSideEffects;
  };
}
