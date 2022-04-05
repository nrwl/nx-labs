import {Tree, formatFiles} from '@nrwl/devkit';
import {LoaderSchema} from './schema';
import {insertImport} from '@nrwl/workspace/src/generators/utils/insert-import';
import {insertStatement} from '@nrwl/workspace/src/generators/utils/insert-statement';

export default async function (tree: Tree, schema: LoaderSchema) {
  const file = tree.read(schema.file);

  if (!file) {
    throw Error(`File ${schema.file} could not be found.`);
  }

  insertImport(tree, schema.file, 'MetaFunction', 'remix');

  insertStatement(tree, schema.file, `    // Provide meta tags for this page.
    // - https://remix.run/api/conventions#meta
    export const meta: MetaFunction = () =>{
      return { title: 'New Route' };
    }`);
  await formatFiles(tree);


}
