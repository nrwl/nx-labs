import { formatFiles, Tree } from '@nrwl/devkit';
import { LoaderSchema } from './schema';
import { insertImport } from '../../utils/insert-import';
import { insertStatementAfterImports } from '../../utils/insert-statement-after-imports';
import { getDefaultExportName } from '../../utils/get-default-export-name';
import { insertStatementInDefaultFunction } from '../../utils/insert-statement-in-default-function';

export default async function (tree: Tree, schema: LoaderSchema) {
  const file = tree.read(schema.file);

  if (!file) {
    throw Error(`File ${schema.file} could not be found.`);
  }

  insertImport(tree, schema.file, 'LoaderFunction', '@remix-run/node', {
    typeOnly: true,
  });
  insertImport(tree, schema.file, 'useLoaderData', '@remix-run/react');
  insertImport(tree, schema.file, 'json', '@remix-run/node');

  const defaultExportName = getDefaultExportName(tree, schema.file);
  const loaderTypeName = `${defaultExportName}LoaderData`;

  insertStatementAfterImports(
    tree,
    schema.file,
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

  insertStatementInDefaultFunction(tree, schema.file, statement);

  await formatFiles(tree);
}
