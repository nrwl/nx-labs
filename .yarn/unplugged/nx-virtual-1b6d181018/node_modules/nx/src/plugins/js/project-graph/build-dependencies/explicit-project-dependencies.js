"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExplicitTypeScriptDependencies = void 0;
const target_project_locator_1 = require("./target-project-locator");
const project_graph_1 = require("../../../../config/project-graph");
const path_1 = require("path");
const workspace_root_1 = require("../../../../utils/workspace-root");
const path_2 = require("../../../../utils/path");
const project_graph_builder_1 = require("../../../../project-graph/project-graph-builder");
function isRoot(projects, projectName) {
    return projects[projectName]?.root === '.';
}
function convertImportToDependency(importExpr, sourceFile, source, type, targetProjectLocator) {
    const target = targetProjectLocator.findProjectWithImport(importExpr, sourceFile) ??
        `npm:${importExpr}`;
    return {
        source,
        target,
        sourceFile,
        type,
    };
}
function buildExplicitTypeScriptDependencies(ctx) {
    // TODO: TargetProjectLocator is a public API, so we can't change the shape of it
    // We should eventually let it accept Record<string, ProjectConfiguration> s.t. we
    // don't have to reshape the CreateDependenciesContext here.
    const nodes = Object.fromEntries(Object.entries(ctx.projects).map(([key, config]) => [
        key,
        {
            name: key,
            type: null,
            data: config,
        },
    ]));
    const targetProjectLocator = new target_project_locator_1.TargetProjectLocator(nodes, ctx.externalNodes);
    const res = [];
    const filesToProcess = {};
    const moduleExtensions = [
        '.ts',
        '.js',
        '.tsx',
        '.jsx',
        '.mts',
        '.mjs',
        '.cjs',
        '.cts',
    ];
    // TODO: This can be removed when vue is stable
    if (isVuePluginInstalled()) {
        moduleExtensions.push('.vue');
    }
    for (const [project, fileData] of Object.entries(ctx.fileMap.projectFileMap)) {
        filesToProcess[project] ??= [];
        for (const { file } of fileData) {
            if (moduleExtensions.some((ext) => file.endsWith(ext))) {
                filesToProcess[project].push((0, path_1.join)(workspace_root_1.workspaceRoot, file));
            }
        }
    }
    const { findImports } = require('../../../../native');
    const imports = findImports(filesToProcess);
    for (const { sourceProject, file, staticImportExpressions, dynamicImportExpressions, } of imports) {
        const normalizedFilePath = (0, path_2.normalizePath)((0, path_1.relative)(workspace_root_1.workspaceRoot, file));
        for (const importExpr of staticImportExpressions) {
            const dependency = convertImportToDependency(importExpr, normalizedFilePath, sourceProject, project_graph_1.DependencyType.static, targetProjectLocator);
            // TODO: These edges technically should be allowed but we need to figure out how to separate config files out from root
            if (isRoot(ctx.projects, dependency.source) ||
                !isRoot(ctx.projects, dependency.target)) {
                res.push(dependency);
            }
        }
        for (const importExpr of dynamicImportExpressions) {
            const dependency = convertImportToDependency(importExpr, normalizedFilePath, sourceProject, project_graph_1.DependencyType.dynamic, targetProjectLocator);
            // TODO: These edges technically should be allowed but we need to figure out how to separate config files out from root
            if (isRoot(ctx.projects, dependency.source) ||
                !isRoot(ctx.projects, dependency.target)) {
                (0, project_graph_builder_1.validateDependency)(dependency, ctx);
                res.push(dependency);
            }
        }
    }
    return res;
}
exports.buildExplicitTypeScriptDependencies = buildExplicitTypeScriptDependencies;
function isVuePluginInstalled() {
    try {
        // nx-ignore-next-line
        require.resolve('@nx/vue');
        return true;
    }
    catch {
        return false;
    }
}
