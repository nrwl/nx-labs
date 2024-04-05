"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.glob = void 0;
const minimatch_1 = require("minimatch");
const globs_1 = require("../../utils/globs");
const workspace_context_1 = require("../../utils/workspace-context");
/**
 * Performs a tree-aware glob search on the files in a workspace. Able to find newly
 * created files and hides deleted files before the updates are committed to disk.
 * Paths should be unix-style with forward slashes.
 *
 * @param tree The file system tree
 * @param patterns A list of glob patterns
 * @returns Normalized paths in the workspace that match the provided glob patterns.
 */
function glob(tree, patterns) {
    const matches = new Set((0, workspace_context_1.globWithWorkspaceContext)(tree.root, patterns));
    const combinedGlob = (0, globs_1.combineGlobPatterns)(patterns);
    const matcher = minimatch_1.minimatch.makeRe(combinedGlob);
    if (!matcher) {
        throw new Error('Invalid glob pattern: ' + combinedGlob);
    }
    for (const change of tree.listChanges()) {
        if (change.type !== 'UPDATE' && matcher.test(change.path)) {
            if (change.type === 'CREATE') {
                matches.add(change.path);
            }
            else if (change.type === 'DELETE') {
                matches.delete(change.path);
            }
        }
    }
    return Array.from(matches);
}
exports.glob = glob;
