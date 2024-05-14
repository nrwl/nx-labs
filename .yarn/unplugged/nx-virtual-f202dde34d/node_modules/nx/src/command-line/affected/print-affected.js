"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectPrintAffected = exports.printAffected = void 0;
const utils_1 = require("../../tasks-runner/utils");
const create_task_graph_1 = require("../../tasks-runner/create-task-graph");
const task_hasher_1 = require("../../hasher/task-hasher");
const hash_task_1 = require("../../hasher/hash-task");
const package_manager_1 = require("../../utils/package-manager");
const command_object_1 = require("./command-object");
const logger_1 = require("../../utils/logger");
const task_env_1 = require("../../tasks-runner/task-env");
const build_project_graph_1 = require("../../project-graph/build-project-graph");
const client_1 = require("../../daemon/client/client");
/**
 * @deprecated Use showProjectsHandler, generateGraph, or affected (without the print-affected mode) instead.
 */
async function printAffected(affectedProjects, projectGraph, { nxJson }, nxArgs, overrides) {
    logger_1.logger.warn([logger_1.NX_PREFIX, command_object_1.printAffectedDeprecationMessage].join(' '));
    const projectsForType = affectedProjects.filter((p) => nxArgs.type ? p.type === nxArgs.type : true);
    const projectNames = projectsForType.map((p) => p.name);
    const tasksJson = nxArgs.targets && nxArgs.targets.length > 0
        ? await createTasks(projectsForType, projectGraph, nxArgs, nxJson, overrides)
        : [];
    const result = {
        tasks: tasksJson,
        projects: projectNames,
        projectGraph: serializeProjectGraph(projectGraph),
    };
    if (nxArgs.select) {
        console.log(selectPrintAffected(result, nxArgs.select));
    }
    else {
        console.log(JSON.stringify(selectPrintAffected(result, null), null, 2));
    }
}
exports.printAffected = printAffected;
async function createTasks(affectedProjectsWithTargetAndConfig, projectGraph, nxArgs, nxJson, overrides) {
    const defaultDependencyConfigs = (0, create_task_graph_1.mapTargetDefaultsToDependencies)(nxJson.targetDefaults);
    const taskGraph = (0, create_task_graph_1.createTaskGraph)(projectGraph, defaultDependencyConfigs, affectedProjectsWithTargetAndConfig.map((p) => p.name), nxArgs.targets, nxArgs.configuration, overrides);
    let hasher;
    if (client_1.daemonClient.enabled()) {
        hasher = new task_hasher_1.DaemonBasedTaskHasher(client_1.daemonClient, {});
    }
    else {
        const { fileMap, allWorkspaceFiles, rustReferences } = (0, build_project_graph_1.getFileMap)();
        hasher = new task_hasher_1.InProcessTaskHasher(fileMap?.projectFileMap, allWorkspaceFiles, projectGraph, nxJson, rustReferences, {});
    }
    const execCommand = (0, package_manager_1.getPackageManagerCommand)().exec;
    const tasks = Object.values(taskGraph.tasks);
    await Promise.all(tasks.map((t) => (0, hash_task_1.hashTask)(hasher, projectGraph, taskGraph, t, 
    // This loads dotenv files for the task
    (0, task_env_1.getTaskSpecificEnv)(t))));
    return tasks.map((task) => ({
        id: task.id,
        overrides,
        target: task.target,
        hash: task.hash,
        command: (0, utils_1.getCommandAsString)(execCommand, task),
        outputs: task.outputs,
    }));
}
function serializeProjectGraph(projectGraph) {
    const nodes = Object.values(projectGraph.nodes).map((n) => n.name);
    const dependencies = {};
    // we don't need external dependencies' dependencies for print-affected
    // having them included makes the output unreadable
    Object.keys(projectGraph.dependencies).forEach((key) => {
        if (!key.startsWith('npm:')) {
            dependencies[key] = projectGraph.dependencies[key];
        }
    });
    return { nodes, dependencies };
}
function selectPrintAffected(wholeJson, wholeSelect) {
    if (!wholeSelect)
        return wholeJson;
    return _select(wholeJson, wholeSelect);
    function _select(json, select) {
        if (select.indexOf('.') > -1) {
            const [firstKey, ...restKeys] = select.split('.');
            const first = json[firstKey];
            throwIfEmpty(wholeSelect, first);
            const rest = restKeys.join('.');
            if (Array.isArray(first)) {
                return first.map((q) => _select(q, rest)).join(', ');
            }
            else {
                return _select(first, rest);
            }
        }
        else {
            const res = json[select];
            throwIfEmpty(wholeSelect, res);
            if (Array.isArray(res)) {
                return res.join(', ');
            }
            else {
                return res;
            }
        }
    }
}
exports.selectPrintAffected = selectPrintAffected;
function throwIfEmpty(select, value) {
    if (value === undefined) {
        throw new Error(`Cannot select '${select}' in the results of print-affected.`);
    }
}
