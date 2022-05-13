import { Tree, formatFiles, names } from '@nrwl/devkit';
import { LoaderSchema } from './schema';
import { insertImport } from '../../utils/insert-import';
import { insertStatementAfterImports } from '../../utils/insert-statement-after-imports';
import { getDefaultExport } from '../../utils/get-default-export';

export default async function (tree: Tree, schema: LoaderSchema) {
  const file = tree.read(schema.file);
  const defaultExport = getDefaultExport(tree, schema.file);
  if (!file) {
    throw Error(`File ${schema.file} could not be found.`);
  }

  insertImport(tree, schema.file, 'MetaFunction', '@remix-run/node', {
    typeOnly: true,
  });

  insertStatementAfterImports(
    tree,
    schema.file,
    `   
    export const meta: MetaFunction = () =>{
      return { title: '${defaultExport.name.text} Route' };
    };
    
    `
  );
  await formatFiles(tree);
}
