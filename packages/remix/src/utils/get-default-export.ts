import {
  createSourceFile,
  isFunctionDeclaration,
  ScriptTarget,
  SyntaxKind,
} from 'typescript';

import { applyChangesToString, ChangeType, Tree } from '@nrwl/devkit';

export function getDefaultExportName(tree: Tree, path: string) {
  return getDefaultExport(tree, path)?.name.text ?? 'Unknown';
}

export function getDefaultExport(tree: Tree, path: string) {
  const contents = tree.read(path, 'utf-8');

  const sourceFile = createSourceFile(path, contents, ScriptTarget.ESNext);

  const functionDeclarations = sourceFile.statements.filter(
    isFunctionDeclaration
  );
  return functionDeclarations.find((functionDeclaration) => {
    const isDefault = functionDeclaration.modifiers.find(
      (mod) => mod.kind === SyntaxKind.DefaultKeyword
    );

    const isExport = functionDeclaration.modifiers.find(
      (mod) => mod.kind === SyntaxKind.ExportKeyword
    );

    return isDefault && isExport;
  });
}

export function insertStatementInDefaultFunction(
  tree: Tree,
  path: string,
  statement
) {
  //need to re-fetch this since the location will have moved atfer the previous inserts
  const defaultExport = getDefaultExport(tree, path);

  const index =
    defaultExport.body.statements.length > 0
      ? defaultExport.body.statements[0].pos
      : 0;

  const newContents = applyChangesToString(tree.read(path, 'utf-8'), [
    {
      type: ChangeType.Insert,
      index,
      text: statement,
    },
  ]);

  tree.write(path, newContents);
}
