import {Tree, formatFiles} from '@nrwl/devkit';
import {LoaderSchema} from './schema';
import {insertImport} from '@nrwl/workspace/src/generators/utils/insert-import';
import {insertStatement} from '@nrwl/workspace/src/generators/utils/insert-statement';

export default async function (tree: Tree, schema: LoaderSchema) {
    const file = tree.read(schema.file);

    if (!file) {
        throw Error(`File ${schema.file} could not be found.`);
    }

    insertImport(tree, schema.file, 'LoaderFunction', 'remix');
    insertImport(tree, schema.file, 'useLoaderData', 'remix');

    insertStatement(tree, schema.file, `
    
    // Use this function to provide data for the route.
    // - https://remix.run/api/conventions#loader
    export const loader: LoaderFunction = async () => {
      return {
        message: 'Hello, world!',
      }
    }`);
    await formatFiles(tree);
}
