import { addProjectConfiguration } from '@nx/devkit';
import { NameAndDirectoryFormat } from '@nx/devkit/src/generators/artifact-name-and-directory-utils';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import errorBoundaryGenerator from './error-boundary.impl';

describe('ErrorBoundary', () => {
  describe.each([
    ['derived', 'app/routes/test.tsx', 'demo'],
    ['as-provided', 'app/routes/test.tsx', ''],
  ])(
    `--nameAndDirectoryFormat=as-provided`,
    (
      nameAndDirectoryFormat: NameAndDirectoryFormat,
      routeFilePath: string,
      project: string
    ) => {
      describe('--apiVersion=1', () => {
        it('should correctly add the ErrorBoundary to the route file', async () => {
          // ARRANGE
          const tree = createTreeWithEmptyWorkspace();
          addProjectConfiguration(tree, 'demo', {
            name: 'demo',
            root: '.',
            sourceRoot: '.',
            projectType: 'application',
          });
          tree.write(routeFilePath, ``);
          tree.write('remix.config.js', `module.exports = {}`);

          // ACT
          await errorBoundaryGenerator(tree, {
            project,
            path: routeFilePath,
            nameAndDirectoryFormat,
            apiVersion: 1,
          });

          // ASSERT
          expect(tree.read(routeFilePath, 'utf-8')).toMatchSnapshot();
        });

        it('should error when the route file cannot be found', async () => {
          // ARRANGE
          const tree = createTreeWithEmptyWorkspace();
          addProjectConfiguration(tree, 'demo', {
            name: 'demo',
            root: '.',
            sourceRoot: '.',
            projectType: 'application',
          });
          const routeFilePath = `app/routes/test.tsx`;
          tree.write(routeFilePath, ``);
          tree.write('remix.config.js', `module.exports = {}`);

          // ACT & ASSERT
          await expect(
            errorBoundaryGenerator(tree, {
              project,
              nameAndDirectoryFormat,
              path: `my-route.tsx`,
              apiVersion: 1,
            })
          ).rejects.toThrow();
        });
      });

      describe('--apiVersion=2', () => {
        it('should correctly add the ErrorBoundary to the route file', async () => {
          // ARRANGE
          const tree = createTreeWithEmptyWorkspace();
          addProjectConfiguration(tree, 'demo', {
            name: 'demo',
            root: '.',
            sourceRoot: '.',
            projectType: 'application',
          });
          const routeFilePath = `app/routes/test.tsx`;
          tree.write(routeFilePath, ``);
          tree.write('remix.config.js', `module.exports = {}`);

          // ACT
          await errorBoundaryGenerator(tree, {
            project,
            path: routeFilePath,
            nameAndDirectoryFormat,
            apiVersion: 2,
          });

          // ASSERT
          expect(tree.read(routeFilePath, 'utf-8')).toMatchSnapshot();
        });

        it('should error when the route file cannot be found', async () => {
          // ARRANGE
          const tree = createTreeWithEmptyWorkspace();
          addProjectConfiguration(tree, 'demo', {
            name: 'demo',
            root: '.',
            sourceRoot: '.',
            projectType: 'application',
          });
          const routeFilePath = `app/routes/test.tsx`;
          tree.write(routeFilePath, ``);
          tree.write('remix.config.js', `module.exports = {}`);

          // ACT & ASSERT
          await expect(
            errorBoundaryGenerator(tree, {
              project,
              nameAndDirectoryFormat,
              path: `my-route.tsx`,
              apiVersion: 2,
            })
          ).rejects.toThrow();
        });
      });
    }
  );
});
