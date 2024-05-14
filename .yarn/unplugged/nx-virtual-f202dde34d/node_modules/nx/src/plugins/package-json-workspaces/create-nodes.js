"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGlobPatternsFromPackageManagerWorkspaces = exports.buildProjectConfigurationFromPackageJson = exports.createNodeFromPackageJson = exports.getNxPackageJsonWorkspacesPlugin = void 0;
const minimatch_1 = require("minimatch");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const nx_json_1 = require("../../config/nx-json");
const workspaces_1 = require("../../config/workspaces");
const fileutils_1 = require("../../utils/fileutils");
const globs_1 = require("../../utils/globs");
const logger_1 = require("../../utils/logger");
const output_1 = require("../../utils/output");
const package_json_1 = require("../../utils/package-json");
const path_1 = require("../../utils/path");
function getNxPackageJsonWorkspacesPlugin(root) {
    const readJson = (f) => (0, fileutils_1.readJsonFile)((0, node_path_1.join)(root, f));
    const patterns = getGlobPatternsFromPackageManagerWorkspaces(root, readJson);
    // If the user only specified a negative pattern, we should find all package.json
    // files and only return those that don't match a negative pattern.
    const negativePatterns = patterns.filter((p) => p.startsWith('!'));
    let positivePatterns = patterns.filter((p) => !p.startsWith('!'));
    if (
    // There are some negative patterns
    negativePatterns.length > 0 &&
        // No positive patterns
        (positivePatterns.length === 0 ||
            // Or only a single positive pattern that is the default coming from root package
            (positivePatterns.length === 1 && positivePatterns[0] === 'package.json'))) {
        positivePatterns.push('**/package.json');
    }
    return {
        name: 'nx/core/package-json-workspaces',
        createNodes: [
            (0, globs_1.combineGlobPatterns)(positivePatterns),
            (p) => {
                if (!negativePatterns.some((negative) => (0, minimatch_1.minimatch)(p, negative))) {
                    return createNodeFromPackageJson(p, root);
                }
                // A negative pattern matched, so we should not create a node for this package.json
                return {};
            },
        ],
    };
}
exports.getNxPackageJsonWorkspacesPlugin = getNxPackageJsonWorkspacesPlugin;
function createNodeFromPackageJson(pkgJsonPath, root) {
    const json = (0, fileutils_1.readJsonFile)((0, node_path_1.join)(root, pkgJsonPath));
    const project = buildProjectConfigurationFromPackageJson(json, pkgJsonPath, (0, nx_json_1.readNxJson)(root));
    return {
        projects: {
            [project.root]: project,
        },
    };
}
exports.createNodeFromPackageJson = createNodeFromPackageJson;
function buildProjectConfigurationFromPackageJson(packageJson, path, nxJson) {
    const normalizedPath = path.split('\\').join('/');
    const directory = (0, node_path_1.dirname)(normalizedPath);
    if (!packageJson.name && directory === '.') {
        throw new Error('Nx requires the root package.json to specify a name if it is being used as an Nx project.');
    }
    let name = packageJson.name ?? (0, workspaces_1.toProjectName)(normalizedPath);
    const projectType = nxJson?.workspaceLayout?.appsDir != nxJson?.workspaceLayout?.libsDir &&
        nxJson?.workspaceLayout?.appsDir &&
        directory.startsWith(nxJson.workspaceLayout.appsDir)
        ? 'application'
        : 'library';
    return {
        root: directory,
        sourceRoot: directory,
        name,
        projectType,
        ...packageJson.nx,
        targets: (0, package_json_1.readTargetsFromPackageJson)(packageJson),
    };
}
exports.buildProjectConfigurationFromPackageJson = buildProjectConfigurationFromPackageJson;
/**
 * Get the package.json globs from package manager workspaces
 */
function getGlobPatternsFromPackageManagerWorkspaces(root, readJson = (path) => (0, fileutils_1.readJsonFile)((0, node_path_1.join)(root, path)) // making this an arg allows us to reuse in devkit
) {
    try {
        const patterns = [];
        const packageJson = readJson('package.json');
        patterns.push(...normalizePatterns(Array.isArray(packageJson.workspaces)
            ? packageJson.workspaces
            : packageJson.workspaces?.packages ?? []));
        if ((0, node_fs_1.existsSync)((0, node_path_1.join)(root, 'pnpm-workspace.yaml'))) {
            try {
                const { packages } = (0, fileutils_1.readYamlFile)((0, node_path_1.join)(root, 'pnpm-workspace.yaml'));
                patterns.push(...normalizePatterns(packages || []));
            }
            catch (e) {
                output_1.output.warn({
                    title: `${logger_1.NX_PREFIX} Unable to parse pnpm-workspace.yaml`,
                    bodyLines: [e.toString()],
                });
            }
        }
        if ((0, node_fs_1.existsSync)((0, node_path_1.join)(root, 'lerna.json'))) {
            try {
                const { packages } = readJson('lerna.json');
                patterns.push(...normalizePatterns(packages?.length > 0 ? packages : ['packages/*']));
            }
            catch (e) {
                output_1.output.warn({
                    title: `${logger_1.NX_PREFIX} Unable to parse lerna.json`,
                    bodyLines: [e.toString()],
                });
            }
        }
        // Merge patterns from workspaces definitions
        // TODO(@AgentEnder): update logic after better way to determine root project inclusion
        // Include the root project
        return packageJson.nx ? patterns.concat('package.json') : patterns;
    }
    catch {
        return [];
    }
}
exports.getGlobPatternsFromPackageManagerWorkspaces = getGlobPatternsFromPackageManagerWorkspaces;
function normalizePatterns(patterns) {
    return patterns.map((pattern) => removeRelativePath(pattern.endsWith('/package.json')
        ? pattern
        : (0, path_1.joinPathFragments)(pattern, 'package.json')));
}
function removeRelativePath(pattern) {
    return pattern.startsWith('./') ? pattern.substring(2) : pattern;
}
