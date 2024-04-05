"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommandGraph = void 0;
const task_graph_utils_1 = require("../tasks-runner/task-graph-utils");
const output_1 = require("../utils/output");
function createCommandGraph(projectGraph, projectNames, nxArgs) {
    const dependencies = {};
    for (const projectName of projectNames) {
        if (projectGraph.dependencies[projectName].length >= 1) {
            dependencies[projectName] = [
                ...new Set(projectGraph.dependencies[projectName]
                    .map((projectDep) => projectDep.target)
                    .filter((projectDep) => projectGraph.nodes[projectDep])).values(),
            ];
        }
        else {
            dependencies[projectName] = [];
        }
    }
    const roots = Object.keys(dependencies).filter((d) => dependencies[d].length === 0);
    const commandGraph = {
        dependencies,
        roots,
    };
    const cycle = (0, task_graph_utils_1.findCycle)(commandGraph);
    if (cycle) {
        if (process.env.NX_IGNORE_CYCLES === 'true' || nxArgs.nxIgnoreCycles) {
            output_1.output.warn({
                title: `The command graph has a circular dependency`,
                bodyLines: [`${cycle.join(' --> ')}`],
            });
            (0, task_graph_utils_1.makeAcyclic)(commandGraph);
        }
        else {
            output_1.output.error({
                title: `Could not execute command because the project graph has a circular dependency`,
                bodyLines: [`${cycle.join(' --> ')}`],
            });
            process.exit(1);
        }
    }
    return commandGraph;
}
exports.createCommandGraph = createCommandGraph;
