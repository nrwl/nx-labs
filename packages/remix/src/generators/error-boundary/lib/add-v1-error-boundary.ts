import { stripIndents, type Tree } from '@nx/devkit';
import { insertStatementAfterImports } from '../../../utils/insert-statement-after-imports';
import type { ErrorBoundarySchema } from '../schema';

export function addV1ErrorBoundary(tree: Tree, options: ErrorBoundarySchema) {
  insertStatementAfterImports(
    tree,
    options.path,
    stripIndents`
    export function ErrorBoundary({ error }) {
        console.error(error);
        return (
            <div>
                <h1>Uh oh ...</h1>
                <p>Something went wrong</p>
                <pre>{error.message || "Unknown error"}</pre>
            </div>
        );
    }
  `
  );
}
