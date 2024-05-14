"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAllProjectNodeDependencies = exports.getSourceDirOfDependentProjects = exports.projectHasTargetAndConfiguration = exports.projectHasTarget = void 0;
const project_graph_1 = require("../project-graph/project-graph");
function projectHasTarget(project, target) {
    return !!(project.data &&
        project.data.targets &&
        project.data.targets[target]);
}
exports.projectHasTarget = projectHasTarget;
function projectHasTargetAndConfiguration(project, target, configuration) {
    return (projectHasTarget(project, target) &&
        project.data.targets[target].configurations &&
        project.data.targets[target].configurations[configuration]);
}
exports.projectHasTargetAndConfiguration = projectHasTargetAndConfiguration;
function getSourceDirOfDependentProjects(projectName, projectGraph = (0, project_graph_1.readCachedProjectGraph)()) {
    if (!projectGraph.nodes[projectName]) {
        throw new Error(`Couldn't find project "${projectName}" in this Nx workspace`);
    }
    const nodeNames = findAllProjectNodeDependencies(projectName, projectGraph);
    return nodeNames.reduce((result, nodeName) => {
        if (projectGraph.nodes[nodeName].data.sourceRoot) {
            result[0].push(projectGraph.nodes[nodeName].data.sourceRoot);
        }
        else {
            result[1].push(nodeName);
        }
        return result;
    }, [[], []]);
}
exports.getSourceDirOfDependentProjects = getSourceDirOfDependentProjects;
/**
 * Find all internal project dependencies.
 * All the external (npm) dependencies will be filtered out unless includeExternalDependencies is set to true
 * @param {string} parentNodeName
 * @param {ProjectGraph} projectGraph
 * @param includeExternalDependencies
 * @returns {string[]}
 */
function findAllProjectNodeDependencies(parentNodeName, projectGraph = (0, project_graph_1.readCachedProjectGraph)(), includeExternalDependencies = false) {
    const dependencyNodeNames = new Set();
    collectDependentProjectNodesNames(projectGraph, dependencyNodeNames, parentNodeName, includeExternalDependencies);
    return Array.from(dependencyNodeNames);
}
exports.findAllProjectNodeDependencies = findAllProjectNodeDependencies;
// Recursively get all the dependencies of the node
function collectDependentProjectNodesNames(nxDeps, dependencyNodeNames, parentNodeName, includeExternalDependencies) {
    const dependencies = nxDeps.dependencies[parentNodeName];
    if (!dependencies) {
        // no dependencies for the given node, so silently return,
        // as we probably wouldn't want to throw here
        return;
    }
    for (const dependency of dependencies) {
        const dependencyName = dependency.target;
        // skip dependencies already added (avoid circular dependencies)
        if (dependencyNodeNames.has(dependencyName)) {
            continue;
        }
        // we're only interested in internal nodes, not external
        if (nxDeps.externalNodes?.[dependencyName]) {
            if (includeExternalDependencies) {
                dependencyNodeNames.add(dependencyName);
            }
            else {
                continue;
            }
        }
        dependencyNodeNames.add(dependencyName);
        // Get the dependencies of the dependencies
        collectDependentProjectNodesNames(nxDeps, dependencyNodeNames, dependencyName, includeExternalDependencies);
    }
}
