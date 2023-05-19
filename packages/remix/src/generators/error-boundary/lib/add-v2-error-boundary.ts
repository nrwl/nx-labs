import { stripIndents, type Tree } from '@nx/devkit';
import { insertImport } from '../../../utils/insert-import';
import { insertStatementAfterImports } from '../../../utils/insert-statement-after-imports';
import type { ErrorBoundarySchema } from '../schema';

export function addV2ErrorBoundary(tree: Tree, options: ErrorBoundarySchema) {
  insertImport(tree, options.path, `useRouteError`, '@remix-run/react');
  insertImport(tree, options.path, `isRouteErrorResponse`, '@remix-run/react');

  insertStatementAfterImports(
    tree,
    options.path,
    stripIndents`
    export function ErrorBoundary() {
        const error = useRouteError();

        // when true, this is what used to go to 'CatchBoundary'
        if (isRouteErrorResponse(error)) {
            return (
                <div>
                    <h1>Oops</h1>
                    <p>Status: {error.status}</p>
                    <p>{error.data.message}</p>
                </div>
            );
        }

        // Don't forget to typecheck with your own logic.
        // Any value can be thrown, not just errors!
        let errorMessage = "Unknown error";
        // if (isDefinitelyAnError(error)) {
        //    errorMessage = error.message;
        // }

        return (
            <div>
                <h1>Uh oh ...</h1>
                <p>Something went wrong.</p>
                <pre>{errorMessage}</pre>
            </div>
        );
    }
  `
  );
}
