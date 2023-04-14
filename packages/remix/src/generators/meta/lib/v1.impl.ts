import {formatFiles, Tree} from '@nrwl/devkit';
import {MetaSchema} from '../schema';
import {insertImport} from '../../../utils/insert-import';
import {insertStatementAfterImports} from '../../../utils/insert-statement-after-imports';
import {getDefaultExportName} from '../../../utils/get-default-export-name';
import {resolveRemixRouteFile} from '../../../utils/remix-route-utils';

export async function v1MetaGenerator(tree: Tree, schema: MetaSchema) {
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

  insertImport(tree, routeFilePath, 'MetaFunction', '@remix-run/node', {
    typeOnly: true,
  });

  const defaultExportName = getDefaultExportName(tree, routeFilePath);
  insertStatementAfterImports(
    tree,
    routeFilePath,
    `
    export const meta: MetaFunction = () =>{
      return { title: '${defaultExportName} Route' };
    };

    `
  );
  await formatFiles(tree);
}
