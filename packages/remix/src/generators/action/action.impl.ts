import { formatFiles, Tree } from '@nrwl/devkit';
import { LoaderSchema } from './schema';
import { insertImport } from '../../utils/insert-import';
import { insertStatementAfterImports } from '../../utils/insert-statement-after-imports';
import {
  getDefaultExportName,
  insertStatementInDefaultFunction,
} from '../../utils/get-default-export';

export default async function (tree: Tree, schema: LoaderSchema) {
  const file = tree.read(schema.file);

  if (!file) {
    throw Error(`File ${schema.file} could not be found.`);
  }

  insertImport(tree, schema.file, 'ActionFunction', '@remix-run/node', {
    typeOnly: true,
  });
  insertImport(tree, schema.file, 'json', '@remix-run/node');
  insertImport(tree, schema.file, 'useActionData', '@remix-run/react');

  const defaultExportName = getDefaultExportName(tree, schema.file);
  const actionTypeName = `${defaultExportName}ActionData`;

  insertStatementAfterImports(
    tree,
    schema.file,
    `
    type ${actionTypeName} = {
        message: string;
    };
    
    export let action: ActionFunction = async ({ request }) => {
      let formData = await request.formData();
  
      return json({message: formData.toString()}, { status: 200 });
    };
    
    `
  );

  const statement = `\nconst actionMessage = useActionData<${actionTypeName}>();`;

  insertStatementInDefaultFunction(tree, schema.file, statement);

  await formatFiles(tree);
}
