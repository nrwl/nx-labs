import { joinPathFragments, Tree, updateJson } from '@nrwl/devkit';

export function addPathToDenoSettings(tree: Tree, path: string) {
  const vscodeSettingsPath = joinPathFragments('.vscode', 'settings.json');

  if (!tree.exists(vscodeSettingsPath)) {
    tree.write(vscodeSettingsPath, JSON.stringify({ enablePaths: [] }));
  }

  updateJson(
    tree,
    vscodeSettingsPath,
    (json) => {
      const paths = new Set(json['deno.enablePaths'] || []);

      paths.add(path);

      json['deno.enablePaths'] = Array.from(paths);

      return json;
    },
    { expectComments: true, allowTrailingComma: true }
  );
}
