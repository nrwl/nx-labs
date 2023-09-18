"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetProjectLocator = void 0;
const typescript_1 = require("../../utils/typescript");
const fileutils_1 = require("../../../../utils/fileutils");
const path_1 = require("path");
const workspace_root_1 = require("../../../../utils/workspace-root");
const module_1 = require("module");
const find_project_for_path_1 = require("../../../../project-graph/utils/find-project-for-path");
const builtInModuleSet = new Set([
    ...module_1.builtinModules,
    ...module_1.builtinModules.map((x) => `node:${x}`),
]);
class TargetProjectLocator {
    constructor(nodes, externalNodes) {
        this.nodes = nodes;
        this.externalNodes = externalNodes;
        this.projectRootMappings = (0, find_project_for_path_1.createProjectRootMappings)(this.nodes);
        this.npmProjects = filterRootExternalDependencies(this.externalNodes);
        this.tsConfig = this.getRootTsConfig();
        this.paths = this.tsConfig.config?.compilerOptions?.paths;
        this.typescriptResolutionCache = new Map();
        this.npmResolutionCache = new Map();
    }
    /**
     * Find a project based on its import
     *
     * @param importExpr
     * @param filePath
     */
    findProjectWithImport(importExpr, filePath) {
        if ((0, fileutils_1.isRelativePath)(importExpr)) {
            const resolvedModule = path_1.posix.join((0, path_1.dirname)(filePath), importExpr);
            return this.findProjectOfResolvedModule(resolvedModule);
        }
        // find project using tsconfig paths
        const results = this.findPaths(importExpr);
        if (results) {
            const [path, paths] = results;
            for (let p of paths) {
                const r = p.endsWith('/*')
                    ? (0, path_1.join)((0, path_1.dirname)(p), (0, path_1.relative)(path.replace(/\*$/, ''), importExpr))
                    : p;
                const maybeResolvedProject = this.findProjectOfResolvedModule(r);
                if (maybeResolvedProject) {
                    return maybeResolvedProject;
                }
            }
        }
        if (builtInModuleSet.has(importExpr)) {
            this.npmResolutionCache.set(importExpr, null);
            return null;
        }
        // try to find npm package before using expensive typescript resolution
        const npmProject = this.findNpmPackage(importExpr);
        if (npmProject) {
            return npmProject;
        }
        if (this.tsConfig.config) {
            // TODO(meeroslav): this block is probably obsolete
            // and existed only because of the incomplete `paths` matching
            // if import cannot be matched using tsconfig `paths` the compilation would fail anyway
            const resolvedProject = this.resolveImportWithTypescript(importExpr, filePath);
            if (resolvedProject) {
                return resolvedProject;
            }
        }
        try {
            const resolvedModule = this.resolveImportWithRequire(importExpr, filePath);
            return this.findProjectOfResolvedModule(resolvedModule);
        }
        catch { }
        // nothing found, cache for later
        this.npmResolutionCache.set(importExpr, null);
        return null;
    }
    /**
     * Return file paths matching the import relative to the repo root
     * @param normalizedImportExpr
     * @returns
     */
    findPaths(normalizedImportExpr) {
        if (!this.paths) {
            return undefined;
        }
        if (this.paths[normalizedImportExpr]) {
            return [normalizedImportExpr, this.paths[normalizedImportExpr]];
        }
        const wildcardPath = Object.keys(this.paths).find((path) => path.endsWith('/*') &&
            (normalizedImportExpr.startsWith(path.replace(/\*$/, '')) ||
                normalizedImportExpr === path.replace(/\/\*$/, '')));
        if (wildcardPath) {
            return [wildcardPath, this.paths[wildcardPath]];
        }
        return undefined;
    }
    resolveImportWithTypescript(normalizedImportExpr, filePath) {
        let resolvedModule;
        if (this.typescriptResolutionCache.has(normalizedImportExpr)) {
            resolvedModule = this.typescriptResolutionCache.get(normalizedImportExpr);
        }
        else {
            resolvedModule = (0, typescript_1.resolveModuleByImport)(normalizedImportExpr, filePath, this.tsConfig.absolutePath);
            this.typescriptResolutionCache.set(normalizedImportExpr, resolvedModule ? resolvedModule : null);
        }
        // TODO: vsavkin temporary workaround. Remove it once we reworking handling of npm packages.
        if (resolvedModule && resolvedModule.indexOf('node_modules/') === -1) {
            const resolvedProject = this.findProjectOfResolvedModule(resolvedModule);
            if (resolvedProject) {
                return resolvedProject;
            }
        }
        return;
    }
    resolveImportWithRequire(normalizedImportExpr, filePath) {
        return path_1.posix.relative(workspace_root_1.workspaceRoot, require.resolve(normalizedImportExpr, {
            paths: [(0, path_1.dirname)(filePath)],
        }));
    }
    findNpmPackage(npmImport) {
        if (this.npmResolutionCache.has(npmImport)) {
            return this.npmResolutionCache.get(npmImport);
        }
        else {
            const pkg = this.npmProjects.find((pkg) => npmImport === pkg.data.packageName ||
                npmImport.startsWith(`${pkg.data.packageName}/`));
            if (pkg) {
                this.npmResolutionCache.set(npmImport, pkg.name);
                return pkg.name;
            }
        }
    }
    findProjectOfResolvedModule(resolvedModule) {
        if (resolvedModule.startsWith('node_modules/') ||
            resolvedModule.includes('/node_modules/')) {
            return undefined;
        }
        const normalizedResolvedModule = resolvedModule.startsWith('./')
            ? resolvedModule.substring(2)
            : resolvedModule;
        const importedProject = this.findMatchingProjectFiles(normalizedResolvedModule);
        return importedProject ? importedProject.name : void 0;
    }
    getAbsolutePath(path) {
        return (0, path_1.join)(workspace_root_1.workspaceRoot, path);
    }
    getRootTsConfig() {
        const path = (0, typescript_1.getRootTsConfigFileName)();
        if (!path) {
            return {
                path: null,
                absolutePath: null,
                config: null,
            };
        }
        const absolutePath = this.getAbsolutePath(path);
        return {
            absolutePath,
            path,
            config: (0, fileutils_1.readJsonFile)(absolutePath),
        };
    }
    findMatchingProjectFiles(file) {
        const project = (0, find_project_for_path_1.findProjectForPath)(file, this.projectRootMappings);
        return this.nodes[project];
    }
}
exports.TargetProjectLocator = TargetProjectLocator;
// matches `npm:@scope/name`, `npm:name` but not `npm:@scope/name@version` and `npm:name@version`
const ROOT_VERSION_PACKAGE_NAME_REGEX = /^npm:(?!.+@.+)/;
function filterRootExternalDependencies(externalNodes) {
    if (!externalNodes) {
        return [];
    }
    const keys = Object.keys(externalNodes);
    const nodes = [];
    for (let i = 0; i < keys.length; i++) {
        if (keys[i].match(ROOT_VERSION_PACKAGE_NAME_REGEX)) {
            nodes.push(externalNodes[keys[i]]);
        }
    }
    return nodes;
}
