"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAffectedGraphNodes = exports.affected = void 0;
const file_utils_1 = require("../../project-graph/file-utils");
const run_command_1 = require("../../tasks-runner/run-command");
const output_1 = require("../../utils/output");
const print_affected_1 = require("./print-affected");
const connect_to_nx_cloud_1 = require("../connect/connect-to-nx-cloud");
const command_line_utils_1 = require("../../utils/command-line-utils");
const perf_hooks_1 = require("perf_hooks");
const project_graph_1 = require("../../project-graph/project-graph");
const project_graph_utils_1 = require("../../utils/project-graph-utils");
const affected_project_graph_1 = require("../../project-graph/affected/affected-project-graph");
const configuration_1 = require("../../config/configuration");
const workspace_configuration_check_1 = require("../../utils/workspace-configuration-check");
const find_matching_projects_1 = require("../../utils/find-matching-projects");
const graph_1 = require("../graph/graph");
const all_file_data_1 = require("../../utils/all-file-data");
const logger_1 = require("../../utils/logger");
const command_object_1 = require("./command-object");
async function affected(command, args, extraTargetDependencies = {}) {
    perf_hooks_1.performance.mark('code-loading:end');
    perf_hooks_1.performance.measure('code-loading', 'init-local', 'code-loading:end');
    (0, workspace_configuration_check_1.workspaceConfigurationCheck)();
    const nxJson = (0, configuration_1.readNxJson)();
    const { nxArgs, overrides } = (0, command_line_utils_1.splitArgsIntoNxArgsAndOverrides)(args, 'affected', {
        printWarnings: command !== 'print-affected' && !args.plain && args.graph !== 'stdout',
    }, nxJson);
    if (nxArgs.verbose) {
        process.env.NX_VERBOSE_LOGGING = 'true';
    }
    await (0, connect_to_nx_cloud_1.connectToNxCloudIfExplicitlyAsked)(nxArgs);
    const projectGraph = await (0, project_graph_1.createProjectGraphAsync)({ exitOnError: true });
    const projects = await getAffectedGraphNodes(nxArgs, projectGraph);
    try {
        switch (command) {
            case 'graph':
                logger_1.logger.warn([logger_1.NX_PREFIX, command_object_1.affectedGraphDeprecationMessage].join(' '));
                const projectNames = projects.map((p) => p.name);
                await (0, graph_1.generateGraph)(args, projectNames);
                break;
            case 'print-affected':
                if (nxArgs.targets && nxArgs.targets.length > 0) {
                    await (0, print_affected_1.printAffected)(allProjectsWithTarget(projects, nxArgs), projectGraph, { nxJson }, nxArgs, overrides);
                }
                else {
                    await (0, print_affected_1.printAffected)(projects, projectGraph, { nxJson }, nxArgs, overrides);
                }
                break;
            case 'affected': {
                const projectsWithTarget = allProjectsWithTarget(projects, nxArgs);
                if (nxArgs.graph) {
                    const projectNames = projectsWithTarget.map((t) => t.name);
                    const file = (0, command_line_utils_1.readGraphFileFromGraphArg)(nxArgs);
                    return await (0, graph_1.generateGraph)({
                        watch: false,
                        open: true,
                        view: 'tasks',
                        targets: nxArgs.targets,
                        projects: projectNames,
                        file,
                    }, projectNames);
                }
                else {
                    const status = await (0, run_command_1.runCommand)(projectsWithTarget, projectGraph, { nxJson }, nxArgs, overrides, null, extraTargetDependencies, { excludeTaskDependencies: false, loadDotEnvFiles: true });
                    process.exit(status);
                }
                break;
            }
        }
        await output_1.output.drain();
    }
    catch (e) {
        printError(e, args.verbose);
        process.exit(1);
    }
}
exports.affected = affected;
async function getAffectedGraphNodes(nxArgs, projectGraph) {
    let affectedGraph = nxArgs.all
        ? projectGraph
        : await (0, affected_project_graph_1.filterAffected)(projectGraph, (0, file_utils_1.calculateFileChanges)((0, command_line_utils_1.parseFiles)(nxArgs).files, await (0, all_file_data_1.allFileData)(), nxArgs));
    if (nxArgs.exclude) {
        const excludedProjects = new Set((0, find_matching_projects_1.findMatchingProjects)(nxArgs.exclude, affectedGraph.nodes));
        return Object.entries(affectedGraph.nodes)
            .filter(([projectName]) => !excludedProjects.has(projectName))
            .map(([, project]) => project);
    }
    return Object.values(affectedGraph.nodes);
}
exports.getAffectedGraphNodes = getAffectedGraphNodes;
function allProjectsWithTarget(projects, nxArgs) {
    return projects.filter((p) => nxArgs.targets.find((target) => (0, project_graph_utils_1.projectHasTarget)(p, target)));
}
function printError(e, verbose) {
    const bodyLines = [e.message];
    if (verbose && e.stack) {
        bodyLines.push('');
        bodyLines.push(e.stack);
    }
    output_1.output.error({
        title: 'There was a critical error when running your command',
        bodyLines,
    });
}
