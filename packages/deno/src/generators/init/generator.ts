import {
  generateFiles,
  joinPathFragments,
  readNxJson,
  stripIndents,
  Tree,
  updateJson,
  updateNxJson,
} from '@nrwl/devkit';
import { execSync } from 'child_process';
import * as path from 'path';

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
  if (!isDenoInstalled()) {
    console.warn(stripIndents`Unable to find Deno on your system. 
Deno will need to be installed in order to run targets from @nrwl/deno in this workspace.
You can learn how to install deno at https://deno.land/manual/getting_started/installation`);
  }
  addFiles(tree);
  addDenoPluginToNxJson(tree);
}

function isDenoInstalled() {
  try {
    execSync('deno --version', {
      encoding: 'utf-8',
      env: process.env,
    });
    return true;
  } catch {
    return false;
  }
}

export default initDeno;
