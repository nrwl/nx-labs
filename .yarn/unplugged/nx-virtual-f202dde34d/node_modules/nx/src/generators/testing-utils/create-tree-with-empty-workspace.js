"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTreeWithEmptyV1Workspace = exports.createTreeWithEmptyWorkspace = void 0;
const tree_1 = require("../tree");
/**
 * Creates a host for testing.
 */
function createTreeWithEmptyWorkspace(opts = {}) {
    const tree = new tree_1.FsTree('/virtual', false);
    return addCommonFiles(tree, opts.layout === 'apps-libs');
}
exports.createTreeWithEmptyWorkspace = createTreeWithEmptyWorkspace;
/**
 * @deprecated use createTreeWithEmptyWorkspace instead
 */
function createTreeWithEmptyV1Workspace() {
    throw new Error('Use createTreeWithEmptyWorkspace instead of createTreeWithEmptyV1Workspace');
}
exports.createTreeWithEmptyV1Workspace = createTreeWithEmptyV1Workspace;
function addCommonFiles(tree, addAppsAndLibsFolders) {
    tree.write('./.prettierrc', JSON.stringify({ singleQuote: true }));
    tree.write('/package.json', JSON.stringify({
        name: '@proj/source',
        dependencies: {},
        devDependencies: {},
    }));
    tree.write('/nx.json', JSON.stringify({
        affected: {
            defaultBase: 'main',
        },
        targetDefaults: {
            build: {
                cache: true,
            },
            lint: {
                cache: true,
            },
        },
    }));
    tree.write('/tsconfig.base.json', JSON.stringify({ compilerOptions: { paths: {} } }));
    if (addAppsAndLibsFolders) {
        tree.write('/apps/.gitignore', '');
        tree.write('/libs/.gitignore', '');
    }
    return tree;
}
