"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRunnerOptions = exports.getRunner = exports.invokeTasksRunner = exports.runCommand = void 0;
const path_1 = require("path");
const workspace_root_1 = require("../utils/workspace-root");
const fileutils_1 = require("../utils/fileutils");
const output_1 = require("../utils/output");
const utils_1 = require("./utils");
const life_cycle_1 = require("./life-cycle");
const static_run_many_terminal_output_life_cycle_1 = require("./life-cycles/static-run-many-terminal-output-life-cycle");
const static_run_one_terminal_output_life_cycle_1 = require("./life-cycles/static-run-one-terminal-output-life-cycle");
const task_timings_life_cycle_1 = require("./life-cycles/task-timings-life-cycle");
const dynamic_run_many_terminal_output_life_cycle_1 = require("./life-cycles/dynamic-run-many-terminal-output-life-cycle");
const task_profiling_life_cycle_1 = require("./life-cycles/task-profiling-life-cycle");
const is_ci_1 = require("../utils/is-ci");
const dynamic_run_one_terminal_output_life_cycle_1 = require("./life-cycles/dynamic-run-one-terminal-output-life-cycle");
const create_task_graph_1 = require("./create-task-graph");
const task_graph_utils_1 = require("./task-graph-utils");
const params_1 = require("../utils/params");
const hash_task_1 = require("../hasher/hash-task");
const client_1 = require("../daemon/client/client");
const store_run_information_life_cycle_1 = require("./life-cycles/store-run-information-life-cycle");
const create_task_hasher_1 = require("../hasher/create-task-hasher");
async function getTerminalOutputLifeCycle(initiatingProject, projectNames, tasks, nxArgs, nxJson, overrides) {
    const { runnerOptions } = getRunner(nxArgs, nxJson);
    const isRunOne = initiatingProject != null;
    const useDynamicOutput = shouldUseDynamicLifeCycle(tasks, runnerOptions, nxArgs.outputStyle);
    const overridesWithoutHidden = { ...overrides };
    delete overridesWithoutHidden['__overrides_unparsed__'];
    if (isRunOne) {
        if (useDynamicOutput) {
            return await (0, dynamic_run_one_terminal_output_life_cycle_1.createRunOneDynamicOutputRenderer)({
                initiatingProject,
                tasks,
                args: nxArgs,
                overrides: overridesWithoutHidden,
            });
        }
        return {
            lifeCycle: new static_run_one_terminal_output_life_cycle_1.StaticRunOneTerminalOutputLifeCycle(initiatingProject, projectNames, tasks, nxArgs),
            renderIsDone: Promise.resolve(),
        };
    }
    else {
        if (useDynamicOutput) {
            return await (0, dynamic_run_many_terminal_output_life_cycle_1.createRunManyDynamicOutputRenderer)({
                projectNames,
                tasks,
                args: nxArgs,
                overrides: overridesWithoutHidden,
            });
        }
        else {
            return {
                lifeCycle: new static_run_many_terminal_output_life_cycle_1.StaticRunManyTerminalOutputLifeCycle(projectNames, tasks, nxArgs, overridesWithoutHidden),
                renderIsDone: Promise.resolve(),
            };
        }
    }
}
function createTaskGraphAndValidateCycles(projectGraph, defaultDependencyConfigs, projectNames, nxArgs, overrides, extraOptions) {
    const taskGraph = (0, create_task_graph_1.createTaskGraph)(projectGraph, defaultDependencyConfigs, projectNames, nxArgs.targets, nxArgs.configuration, overrides, extraOptions.excludeTaskDependencies);
    const cycle = (0, task_graph_utils_1.findCycle)(taskGraph);
    if (cycle) {
        if (process.env.NX_IGNORE_CYCLES === 'true' || nxArgs.nxIgnoreCycles) {
            output_1.output.warn({
                title: `The task graph has a circular dependency`,
                bodyLines: [`${cycle.join(' --> ')}`],
            });
            (0, task_graph_utils_1.makeAcyclic)(taskGraph);
        }
        else {
            output_1.output.error({
                title: `Could not execute command because the task graph has a circular dependency`,
                bodyLines: [`${cycle.join(' --> ')}`],
            });
            process.exit(1);
        }
    }
    return taskGraph;
}
async function runCommand(projectsToRun, projectGraph, { nxJson }, nxArgs, overrides, initiatingProject, extraTargetDependencies, extraOptions) {
    const status = await (0, params_1.handleErrors)(process.env.NX_VERBOSE_LOGGING === 'true', async () => {
        const defaultDependencyConfigs = mergeTargetDependencies(nxJson.targetDefaults, extraTargetDependencies);
        const projectNames = projectsToRun.map((t) => t.name);
        const taskGraph = createTaskGraphAndValidateCycles(projectGraph, defaultDependencyConfigs, projectNames, nxArgs, overrides, extraOptions);
        const tasks = Object.values(taskGraph.tasks);
        const { lifeCycle, renderIsDone } = await getTerminalOutputLifeCycle(initiatingProject, projectNames, tasks, nxArgs, nxJson, overrides);
        const status = await invokeTasksRunner({
            tasks,
            projectGraph,
            taskGraph,
            lifeCycle,
            nxJson,
            nxArgs,
            loadDotEnvFiles: extraOptions.loadDotEnvFiles,
            initiatingProject,
        });
        await renderIsDone;
        return status;
    });
    return status;
}
exports.runCommand = runCommand;
function setEnvVarsBasedOnArgs(nxArgs, loadDotEnvFiles) {
    if (nxArgs.outputStyle == 'stream' ||
        process.env.NX_BATCH_MODE === 'true' ||
        nxArgs.batch) {
        process.env.NX_STREAM_OUTPUT = 'true';
        process.env.NX_PREFIX_OUTPUT = 'true';
    }
    if (nxArgs.outputStyle == 'stream-without-prefixes') {
        process.env.NX_STREAM_OUTPUT = 'true';
    }
    if (loadDotEnvFiles) {
        process.env.NX_LOAD_DOT_ENV_FILES = 'true';
    }
}
async function invokeTasksRunner({ tasks, projectGraph, taskGraph, lifeCycle, nxJson, nxArgs, loadDotEnvFiles, initiatingProject, }) {
    setEnvVarsBasedOnArgs(nxArgs, loadDotEnvFiles);
    const { tasksRunner, runnerOptions } = getRunner(nxArgs, nxJson);
    let hasher = (0, create_task_hasher_1.createTaskHasher)(projectGraph, nxJson, runnerOptions);
    // this is used for two reasons: to fetch all remote cache hits AND
    // to submit everything that is known in advance to Nx Cloud to run in
    // a distributed fashion
    await (0, hash_task_1.hashTasksThatDoNotDependOnOutputsOfOtherTasks)(hasher, projectGraph, taskGraph, nxJson);
    const promiseOrObservable = tasksRunner(tasks, {
        ...runnerOptions,
        lifeCycle: new life_cycle_1.CompositeLifeCycle(constructLifeCycles(lifeCycle)),
    }, {
        initiatingProject: nxArgs.outputStyle === 'compact' ? null : initiatingProject,
        projectGraph,
        nxJson,
        nxArgs,
        taskGraph,
        hasher: {
            hashTask(task, taskGraph_, env) {
                if (!taskGraph_) {
                    output_1.output.warn({
                        title: `TaskGraph is now required as an argument to hashTask`,
                        bodyLines: [
                            `The TaskGraph object can be retrieved from the context`,
                            'This will result in an error in Nx 19',
                        ],
                    });
                    taskGraph_ = taskGraph;
                }
                if (!env) {
                    output_1.output.warn({
                        title: `The environment variables are now required as an argument to hashTask`,
                        bodyLines: [
                            `Please pass the environment variables used when running the task`,
                            'This will result in an error in Nx 19',
                        ],
                    });
                    env = process.env;
                }
                return hasher.hashTask(task, taskGraph_, env);
            },
            hashTasks(task, taskGraph_, env) {
                if (!taskGraph_) {
                    output_1.output.warn({
                        title: `TaskGraph is now required as an argument to hashTasks`,
                        bodyLines: [
                            `The TaskGraph object can be retrieved from the context`,
                            'This will result in an error in Nx 19',
                        ],
                    });
                    taskGraph_ = taskGraph;
                }
                if (!env) {
                    output_1.output.warn({
                        title: `The environment variables are now required as an argument to hashTasks`,
                        bodyLines: [
                            `Please pass the environment variables used when running the tasks`,
                            'This will result in an error in Nx 19',
                        ],
                    });
                    env = process.env;
                }
                return hasher.hashTasks(task, taskGraph_, env);
            },
        },
        daemon: client_1.daemonClient,
    });
    let anyFailures;
    if (promiseOrObservable.subscribe) {
        anyFailures = await anyFailuresInObservable(promiseOrObservable);
    }
    else {
        // simply await the promise
        anyFailures = await anyFailuresInPromise(promiseOrObservable);
    }
    return anyFailures ? 1 : 0;
}
exports.invokeTasksRunner = invokeTasksRunner;
function constructLifeCycles(lifeCycle) {
    const lifeCycles = [];
    lifeCycles.push(new store_run_information_life_cycle_1.StoreRunInformationLifeCycle());
    lifeCycles.push(lifeCycle);
    if (process.env.NX_PERF_LOGGING === 'true') {
        lifeCycles.push(new task_timings_life_cycle_1.TaskTimingsLifeCycle());
    }
    if (process.env.NX_PROFILE) {
        lifeCycles.push(new task_profiling_life_cycle_1.TaskProfilingLifeCycle(process.env.NX_PROFILE));
    }
    return lifeCycles;
}
function mergeTargetDependencies(defaults, deps) {
    const res = {};
    Object.keys(defaults ?? {}).forEach((k) => {
        res[k] = defaults[k].dependsOn;
    });
    if (deps) {
        Object.keys(deps).forEach((k) => {
            if (res[k]) {
                res[k] = [...res[k], deps[k]];
            }
            else {
                res[k] = deps[k];
            }
        });
        return res;
    }
}
async function anyFailuresInPromise(promise) {
    return Object.values(await promise).some((v) => v === 'failure' || v === 'skipped');
}
async function anyFailuresInObservable(obs) {
    return await new Promise((res) => {
        let anyFailures = false;
        obs.subscribe((t) => {
            if (!t.success) {
                anyFailures = true;
            }
        }, (error) => {
            output_1.output.error({
                title: 'Unhandled error in task executor',
            });
            console.error(error);
            res(true);
        }, () => {
            res(anyFailures);
        });
    });
}
function shouldUseDynamicLifeCycle(tasks, options, outputStyle) {
    if (process.env.NX_BATCH_MODE === 'true' ||
        process.env.NX_VERBOSE_LOGGING === 'true' ||
        process.env.NX_TASKS_RUNNER_DYNAMIC_OUTPUT === 'false') {
        return false;
    }
    if (!process.stdout.isTTY)
        return false;
    if ((0, is_ci_1.isCI)())
        return false;
    if (outputStyle === 'static' || outputStyle === 'stream')
        return false;
    return !tasks.find((t) => (0, utils_1.shouldStreamOutput)(t, null));
}
function loadTasksRunner(modulePath) {
    try {
        const maybeTasksRunner = require(modulePath);
        // to support both babel and ts formats
        return 'default' in maybeTasksRunner
            ? maybeTasksRunner.default
            : maybeTasksRunner;
    }
    catch (e) {
        if (e.code === 'MODULE_NOT_FOUND' &&
            (modulePath === 'nx-cloud' || modulePath === '@nrwl/nx-cloud')) {
            return require('../nx-cloud/nx-cloud-tasks-runner-shell')
                .nxCloudTasksRunnerShell;
        }
        throw e;
    }
}
function getRunner(nxArgs, nxJson) {
    let runner = nxArgs.runner;
    runner = runner || 'default';
    if (runner !== 'default' && !nxJson.tasksRunnerOptions?.[runner]) {
        throw new Error(`Could not find runner configuration for ${runner}`);
    }
    const modulePath = getTasksRunnerPath(runner, nxJson);
    try {
        const tasksRunner = loadTasksRunner(modulePath);
        return {
            tasksRunner,
            runnerOptions: getRunnerOptions(runner, nxJson, nxArgs, modulePath === 'nx-cloud'),
        };
    }
    catch {
        throw new Error(`Could not find runner configuration for ${runner}`);
    }
}
exports.getRunner = getRunner;
function getTasksRunnerPath(runner, nxJson) {
    let modulePath = nxJson.tasksRunnerOptions?.[runner]?.runner;
    if (modulePath) {
        if ((0, fileutils_1.isRelativePath)(modulePath)) {
            return (0, path_1.join)(workspace_root_1.workspaceRoot, modulePath);
        }
        return modulePath;
    }
    const isCloudRunner = 
    // No tasksRunnerOptions for given --runner
    nxJson.nxCloudAccessToken ||
        // No runner prop in tasks runner options, check if access token is set.
        nxJson.tasksRunnerOptions?.[runner]?.options?.accessToken ||
        // Cloud access token specified in env var.
        process.env.NX_CLOUD_ACCESS_TOKEN;
    return isCloudRunner ? 'nx-cloud' : require.resolve('./default-tasks-runner');
}
function getRunnerOptions(runner, nxJson, nxArgs, isCloudDefault) {
    const defaultCacheableOperations = [];
    for (const key in nxJson.targetDefaults) {
        if (nxJson.targetDefaults[key].cache) {
            defaultCacheableOperations.push(key);
        }
    }
    const result = {
        ...nxJson.tasksRunnerOptions?.[runner]?.options,
        ...nxArgs,
    };
    // NOTE: we don't pull from env here because the cloud package
    // supports it within nx-cloud's implementation. We could
    // normalize it here, and that may make more sense, but
    // leaving it as is for now.
    if (nxJson.nxCloudAccessToken && isCloudDefault) {
        result.accessToken ??= nxJson.nxCloudAccessToken;
    }
    if (nxJson.nxCloudUrl && isCloudDefault) {
        result.url ??= nxJson.nxCloudUrl;
    }
    if (nxJson.nxCloudEncryptionKey && isCloudDefault) {
        result.encryptionKey ??= nxJson.nxCloudEncryptionKey;
    }
    if (nxJson.parallel) {
        result.parallel ??= nxJson.parallel;
    }
    if (nxJson.cacheDirectory) {
        result.cacheDirectory ??= nxJson.cacheDirectory;
    }
    if (defaultCacheableOperations.length) {
        result.cacheableOperations ??= [];
        result.cacheableOperations = result.cacheableOperations.concat(defaultCacheableOperations);
    }
    if (nxJson.useDaemonProcess !== undefined) {
        result.useDaemonProcess ??= nxJson.useDaemonProcess;
    }
    return result;
}
exports.getRunnerOptions = getRunnerOptions;
