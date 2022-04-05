import {Tree, formatFiles} from '@nrwl/devkit';
import {LoaderSchema} from './schema';
import {insertImport} from '@nrwl/workspace/src/generators/utils/insert-import';
import {insertStatement} from '@nrwl/workspace/src/generators/utils/insert-statement';

export default async function (tree: Tree, schema: LoaderSchema) {
  const file = tree.read(schema.file);

  if (!file) {
    throw Error(`File ${schema.file} could not be found.`);
  }

  insertImport(tree, schema.file, 'ActionFunction', 'remix');
  insertImport(tree, schema.file, 'json', 'remix');

  insertStatement(tree, schema.file, `export let action: ActionFunction = async ({ request }) => {
  let formData = await request.formData();
  
    return json({echo: formData.toString()}, { status: 400 });
  


};`);
  await formatFiles(tree);


}

