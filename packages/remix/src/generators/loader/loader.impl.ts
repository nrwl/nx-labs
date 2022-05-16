import { formatFiles, Tree } from '@nrwl/devkit';
import { LoaderSchema } from './schema';
import { insertImport } from '../../utils/insert-import';
import { insertStatementAfterImports } from '../../utils/insert-statement-after-imports';
import { getDefaultExportName } from '../../utils/get-default-export-name';
import { insertStatementInDefaultFunction } from '../../utils/insert-statement-in-default-function';
import { resolveRemixRouteFile } from '../../utils/remix-route-utils';

export default async function (tree: Tree, schema: LoaderSchema) {
  const routeFilePath = resolveRemixRouteFile(
    tree,
    schema.path,
    schema.project
  );

  if (!tree.exists(routeFilePath)) {
    throw new Error(
      `Route path does not exist: ${routeFilePath}. Please generate a Remix route first.`
    );
  }

  insertImport(tree, routeFilePath, 'LoaderFunction', '@remix-run/node', {
    typeOnly: true,
  });
  insertImport(tree, routeFilePath, 'useLoaderData', '@remix-run/react');
  insertImport(tree, routeFilePath, 'json', '@remix-run/node');

  const defaultExportName = getDefaultExportName(tree, routeFilePath);
  const loaderTypeName = `${defaultExportName}LoaderData`;

  insertStatementAfterImports(
    tree,
    routeFilePath,
    `
    type ${loaderTypeName} = {
        message: string;
    };

    export const loader: LoaderFunction = async () => {
      return json({
        message: 'Hello, world!',
      })
    };
    
    `
  );

  const statement = `\nconst data = useLoaderData<${loaderTypeName}>();`;

  try {
    insertStatementInDefaultFunction(tree, routeFilePath, statement);
    // eslint-disable-next-line no-empty
  } catch (err) {
  } finally {
    await formatFiles(tree);
  }
}
