import {
  generateFiles,
  joinPathFragments,
  readNxJson,
  Tree,
  updateJson,
  updateNxJson,
} from '@nx/devkit';
import * as path from 'path';
import { assertDenoInstalled } from '../../utils/run-deno';

function addFiles(tree: Tree) {
  if (!tree.exists('import_map.json')) {
    generateFiles(tree, path.join(__dirname, 'files'), '.', {});
  }

  // TODO(caleb): is there a way we can hint at other editors to turn on on deno support

  const vscodeExtensionsPath = joinPathFragments('.vscode/extensions.json');
  const vscodeSettingsPath = joinPathFragments('.vscode/settings.json');
  // enable deno support for vscode
  if (!tree.exists(vscodeExtensionsPath)) {
    tree.write(vscodeExtensionsPath, JSON.stringify({}));
  }
  updateJson(tree, vscodeExtensionsPath, (json) => {
    json = json || {};
    const recommendations = new Set<string>(json.recommendations || []);
    recommendations.add('denoland.vscode-deno');
    json.recommendations = Array.from(recommendations);
    return json;
  });

  if (!tree.exists(vscodeSettingsPath)) {
    tree.write(vscodeSettingsPath, JSON.stringify({}));
  }
  updateJson(tree, vscodeSettingsPath, (json) => {
    json = json || {};
    json['deno.enablePaths'] ??= [];
    json['deno.unstable'] ??= true;
    json['deno.importMap'] ??= './import_map.json';
    return json;
  });
}

function addDenoPluginToNxJson(tree: Tree) {
  const nxJson = readNxJson(tree);

  const plugins = new Set<string>(nxJson.plugins || []);
  plugins.add('@nrwl/deno');
  nxJson.plugins = Array.from(plugins);

  updateNxJson(tree, nxJson);
}

export async function initDeno(tree: Tree) {
  assertDenoInstalled();
  addFiles(tree);
  addDenoPluginToNxJson(tree);
}

export default initDeno;
