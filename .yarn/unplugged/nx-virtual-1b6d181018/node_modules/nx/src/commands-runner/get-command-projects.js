"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommandProjects = void 0;
const utils_1 = require("../tasks-runner/utils");
const create_command_graph_1 = require("./create-command-graph");
function getCommandProjects(projectGraph, projects, nxArgs) {
    const commandGraph = (0, create_command_graph_1.createCommandGraph)(projectGraph, projects.map((project) => project.name), nxArgs);
    return getSortedProjects(commandGraph);
}
exports.getCommandProjects = getCommandProjects;
function getSortedProjects(commandGraph, sortedProjects = []) {
    const roots = commandGraph.roots;
    if (!roots.length) {
        return sortedProjects;
    }
    sortedProjects.push(...roots);
    const newGraph = (0, utils_1.removeIdsFromGraph)(commandGraph, roots, commandGraph.dependencies);
    return getSortedProjects(newGraph, sortedProjects);
}
