import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import libraryGenerator from '../library/library.impl';
import storybookConfigurationGenerator from './storybook-configuration.impl';

describe('Storybook Configuration', () => {
  it.each(['jest', 'vitest', 'none'])(
    'it should create a storybook configuration and use react-vite framework with testing framework %s',
    async (unitTestRunner: 'jest' | 'vitest' | 'none') => {
      // ARRANGE
      const tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });

      await libraryGenerator(tree, {
        name: 'storybook-test',
        style: 'css',
        unitTestRunner,
      });

      // ACT
      await storybookConfigurationGenerator(tree, {
        name: 'storybook-test',
        configureCypress: false,
        configureStaticServe: false,
        generateStories: true,
      });

      // ASSERT
      expect(tree.exists(`libs/storybook-test/vite.config.ts`));
      expect(
        tree.read(`libs/storybook-test/.storybook/main.js`, 'utf-8')
      ).toMatchSnapshot();
    }
  );
});
