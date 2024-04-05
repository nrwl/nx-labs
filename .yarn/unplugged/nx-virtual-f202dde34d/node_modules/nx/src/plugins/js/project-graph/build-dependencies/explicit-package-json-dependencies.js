"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildExplicitPackageJsonDependencies = void 0;
const file_utils_1 = require("../../../../project-graph/file-utils");
const path_1 = require("path");
const project_graph_1 = require("../../../../config/project-graph");
const json_1 = require("../../../../utils/json");
const path_2 = require("../../../../utils/path");
const project_graph_builder_1 = require("../../../../project-graph/project-graph-builder");
function buildExplicitPackageJsonDependencies(ctx) {
    const res = [];
    let packageNameMap = undefined;
    const nodes = Object.values(ctx.projects);
    Object.keys(ctx.filesToProcess.projectFileMap).forEach((source) => {
        Object.values(ctx.filesToProcess.projectFileMap[source]).forEach((f) => {
            if (isPackageJsonAtProjectRoot(nodes, f.file)) {
                // we only create the package name map once and only if a package.json file changes
                packageNameMap = packageNameMap || createPackageNameMap(ctx.projects);
                processPackageJson(source, f.file, ctx, res, packageNameMap);
            }
        });
    });
    return res;
}
exports.buildExplicitPackageJsonDependencies = buildExplicitPackageJsonDependencies;
function createPackageNameMap(projects) {
    const res = {};
    for (let projectName of Object.keys(projects)) {
        try {
            const packageJson = (0, json_1.parseJson)((0, file_utils_1.defaultFileRead)((0, path_1.join)(projects[projectName].root, 'package.json')));
            res[packageJson.name ?? projectName] = projectName;
        }
        catch (e) { }
    }
    return res;
}
function isPackageJsonAtProjectRoot(nodes, fileName) {
    return (fileName.endsWith('package.json') &&
        nodes.find((projectNode) => (0, path_2.joinPathFragments)(projectNode.root, 'package.json') === fileName));
}
function processPackageJson(sourceProject, fileName, ctx, collectedDeps, packageNameMap) {
    try {
        const deps = readDeps((0, json_1.parseJson)((0, file_utils_1.defaultFileRead)(fileName)));
        // the name matches the import path
        deps.forEach((d) => {
            // package.json refers to another project in the monorepo
            if (packageNameMap[d]) {
                const dependency = {
                    source: sourceProject,
                    target: packageNameMap[d],
                    sourceFile: fileName,
                    type: project_graph_1.DependencyType.static,
                };
                (0, project_graph_builder_1.validateDependency)(dependency, ctx);
                collectedDeps.push(dependency);
            }
            else if (ctx.externalNodes[`npm:${d}`]) {
                const dependency = {
                    source: sourceProject,
                    target: `npm:${d}`,
                    sourceFile: fileName,
                    type: project_graph_1.DependencyType.static,
                };
                (0, project_graph_builder_1.validateDependency)(dependency, ctx);
                collectedDeps.push(dependency);
            }
        });
    }
    catch (e) {
        if (process.env.NX_VERBOSE_LOGGING === 'true') {
            console.log(e);
        }
    }
}
function readDeps(packageJson) {
    return [
        ...Object.keys(packageJson?.dependencies ?? {}),
        ...Object.keys(packageJson?.devDependencies ?? {}),
        ...Object.keys(packageJson?.peerDependencies ?? {}),
        ...Object.keys(packageJson?.optionalDependencies ?? {}),
    ];
}
