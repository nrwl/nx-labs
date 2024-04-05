"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showProjectHandler = exports.showProjectsHandler = void 0;
const output_1 = require("../../utils/output");
const nx_json_1 = require("../../config/nx-json");
const affected_project_graph_1 = require("../../project-graph/affected/affected-project-graph");
const file_utils_1 = require("../../project-graph/file-utils");
const operators_1 = require("../../project-graph/operators");
const project_graph_1 = require("../../project-graph/project-graph");
const all_file_data_1 = require("../../utils/all-file-data");
const command_line_utils_1 = require("../../utils/command-line-utils");
const find_matching_projects_1 = require("../../utils/find-matching-projects");
const graph_1 = require("../graph/graph");
async function showProjectsHandler(args) {
    let graph = await (0, project_graph_1.createProjectGraphAsync)();
    const nxJson = (0, nx_json_1.readNxJson)();
    const { nxArgs } = (0, command_line_utils_1.splitArgsIntoNxArgsAndOverrides)(args, 'affected', {
        printWarnings: false,
    }, nxJson);
    // Affected touches dependencies so it needs to be processed first.
    if (args.affected) {
        const touchedFiles = await getTouchedFiles(nxArgs);
        graph = await getAffectedGraph(touchedFiles, nxJson, graph);
    }
    const filter = (0, operators_1.filterNodes)((node) => {
        if (args.type && node.type !== args.type) {
            return false;
        }
        return true;
    });
    graph = filter(graph);
    // Apply projects filter and get resultant graph
    if (args.projects) {
        graph.nodes = getGraphNodesMatchingPatterns(graph, args.projects);
    }
    // Grab only the nodes with the specified target
    if (args.withTarget) {
        graph.nodes = Object.entries(graph.nodes).reduce((acc, [name, node]) => {
            if (args.withTarget.some((target) => node.data.targets?.[target])) {
                acc[name] = node;
            }
            return acc;
        }, {});
    }
    const selectedProjects = new Set(Object.keys(graph.nodes));
    if (args.exclude) {
        const excludedProjects = (0, find_matching_projects_1.findMatchingProjects)(nxArgs.exclude, graph.nodes);
        for (const excludedProject of excludedProjects) {
            selectedProjects.delete(excludedProject);
        }
    }
    if (args.json) {
        console.log(JSON.stringify(Array.from(selectedProjects)));
    }
    else {
        for (const project of selectedProjects) {
            console.log(project);
        }
    }
    await output_1.output.drain();
    process.exit(0);
}
exports.showProjectsHandler = showProjectsHandler;
async function showProjectHandler(args) {
    const graph = await (0, project_graph_1.createProjectGraphAsync)();
    const node = graph.nodes[args.projectName];
    if (!node) {
        console.log(`Could not find project ${args.projectName}`);
        process.exit(1);
    }
    if (args.json) {
        console.log(JSON.stringify(node.data));
    }
    else if (args.web) {
        await (0, graph_1.generateGraph)({
            view: 'project-details',
            focus: node.name,
            watch: true,
            open: true,
        }, []);
    }
    else {
        const chalk = require('chalk');
        const logIfExists = (label, key) => {
            if (node.data[key]) {
                console.log(`${chalk.bold(label)}: ${node.data[key]}`);
            }
        };
        logIfExists('Name', 'name');
        logIfExists('Root', 'root');
        logIfExists('Source Root', 'sourceRoot');
        logIfExists('Tags', 'tags');
        logIfExists('Implicit Dependencies', 'implicitDependencies');
        const targets = Object.entries(node.data.targets ?? {});
        const maxTargetNameLength = Math.max(...targets.map(([t]) => t.length));
        const maxExecutorNameLength = Math.max(...targets.map(([, t]) => t?.executor?.length ?? 0));
        if (targets.length > 0) {
            console.log(`${chalk.bold('Targets')}: `);
            for (const [target, targetConfig] of targets) {
                console.log(`- ${chalk.bold((target + ':').padEnd(maxTargetNameLength + 2))} ${(targetConfig?.executor ?? '').padEnd(maxExecutorNameLength + 2)} ${(() => {
                    const configurations = Object.keys(targetConfig.configurations ?? {});
                    if (configurations.length) {
                        return chalk.dim(configurations.join(', '));
                    }
                    return '';
                })()}`);
            }
        }
    }
    process.exit(0);
}
exports.showProjectHandler = showProjectHandler;
function getGraphNodesMatchingPatterns(graph, patterns) {
    const nodes = {};
    const matches = (0, find_matching_projects_1.findMatchingProjects)(patterns, graph.nodes);
    for (const match of matches) {
        nodes[match] = graph.nodes[match];
    }
    return nodes;
}
function getAffectedGraph(touchedFiles, nxJson, graph) {
    return (0, affected_project_graph_1.filterAffected)(graph, touchedFiles, nxJson);
}
async function getTouchedFiles(nxArgs) {
    return (0, file_utils_1.calculateFileChanges)((0, command_line_utils_1.parseFiles)(nxArgs).files, await (0, all_file_data_1.allFileData)(), nxArgs);
}
