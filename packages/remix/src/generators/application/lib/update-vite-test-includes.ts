import { stripIndents, type Tree } from '@nx/devkit';
import { tsquery } from '@phenomnomnominal/tsquery';

export function updateViteTestIncludes(tree: Tree, pathToViteConfig: string) {
  const fileContents = tree.read(pathToViteConfig, 'utf-8');

  const ast = tsquery.ast(fileContents);

  const TEST_INCLUDE_SELECTOR =
    'PropertyAssignment:has(Identifier[name=test]) PropertyAssignment:has(Identifier[name=include])';
  const nodes = tsquery(ast, TEST_INCLUDE_SELECTOR, { visitAllChildren: true });

  if (nodes.length !== 0) {
    const updatedFileContents = stripIndents`${fileContents.slice(
      0,
      nodes[0].getStart()
    )}include: ["./app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"]${fileContents.slice(
      nodes[0].getEnd()
    )}`;

    tree.write(pathToViteConfig, updatedFileContents);
  }
}
