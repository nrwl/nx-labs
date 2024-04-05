"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnvVariablesForTask = exports.getTaskSpecificEnv = exports.getEnvVariablesForBatchProcess = void 0;
const dotenv_1 = require("dotenv");
const dotenv_expand_1 = require("dotenv-expand");
const workspace_root_1 = require("../utils/workspace-root");
function getEnvVariablesForBatchProcess(skipNxCache, captureStderr) {
    return {
        // User Process Env Variables override Dotenv Variables
        ...process.env,
        // Nx Env Variables overrides everything
        ...getNxEnvVariablesForForkedProcess(process.env.FORCE_COLOR === undefined ? 'true' : process.env.FORCE_COLOR, skipNxCache, captureStderr),
    };
}
exports.getEnvVariablesForBatchProcess = getEnvVariablesForBatchProcess;
function getTaskSpecificEnv(task) {
    // Unload any dot env files at the root of the workspace that were loaded on init of Nx.
    const taskEnv = unloadDotEnvFiles({ ...process.env });
    return process.env.NX_LOAD_DOT_ENV_FILES === 'true'
        ? loadDotEnvFilesForTask(task, taskEnv)
        : // If not loading dot env files, ensure env vars created by system are still loaded
            taskEnv;
}
exports.getTaskSpecificEnv = getTaskSpecificEnv;
function getEnvVariablesForTask(task, taskSpecificEnv, forceColor, skipNxCache, captureStderr, outputPath, streamOutput) {
    const res = {
        // Start With Dotenv Variables
        ...taskSpecificEnv,
        // Nx Env Variables overrides everything
        ...getNxEnvVariablesForTask(task, forceColor, skipNxCache, captureStderr, outputPath, streamOutput),
    };
    // we have to delete it because if we invoke Nx from within Nx, we need to reset those values
    if (!outputPath) {
        delete res.NX_TERMINAL_OUTPUT_PATH;
        delete res.NX_STREAM_OUTPUT;
        delete res.NX_PREFIX_OUTPUT;
    }
    // we don't reset NX_BASE or NX_HEAD because those are set by the user and should be preserved
    delete res.NX_SET_CLI;
    return res;
}
exports.getEnvVariablesForTask = getEnvVariablesForTask;
function getNxEnvVariablesForForkedProcess(forceColor, skipNxCache, captureStderr, outputPath, streamOutput) {
    const env = {
        FORCE_COLOR: forceColor,
        NX_WORKSPACE_ROOT: workspace_root_1.workspaceRoot,
        NX_SKIP_NX_CACHE: skipNxCache ? 'true' : undefined,
    };
    if (outputPath) {
        env.NX_TERMINAL_OUTPUT_PATH = outputPath;
        if (captureStderr) {
            env.NX_TERMINAL_CAPTURE_STDERR = 'true';
        }
        if (streamOutput) {
            env.NX_STREAM_OUTPUT = 'true';
        }
    }
    return env;
}
function getNxEnvVariablesForTask(task, forceColor, skipNxCache, captureStderr, outputPath, streamOutput) {
    const env = {
        NX_TASK_TARGET_PROJECT: task.target.project,
        NX_TASK_TARGET_TARGET: task.target.target,
        NX_TASK_TARGET_CONFIGURATION: task.target.configuration ?? undefined,
        NX_TASK_HASH: task.hash,
        // used when Nx is invoked via Lerna
        LERNA_PACKAGE_NAME: task.target.project,
    };
    // TODO: remove this once we have a reasonable way to configure it
    if (task.target.target === 'test') {
        env.NX_TERMINAL_CAPTURE_STDERR = 'true';
    }
    return {
        ...getNxEnvVariablesForForkedProcess(forceColor, skipNxCache, captureStderr, outputPath, streamOutput),
        ...env,
    };
}
function loadDotEnvFilesForTask(task, environmentVariables) {
    // Collect dot env files that may pertain to a task
    const dotEnvFiles = [
        // Load DotEnv Files for a configuration in the project root
        ...(task.target.configuration
            ? [
                `${task.projectRoot}/.env.${task.target.target}.${task.target.configuration}`,
                `${task.projectRoot}/.env.${task.target.configuration}`,
                `${task.projectRoot}/.${task.target.target}.${task.target.configuration}.env`,
                `${task.projectRoot}/.${task.target.configuration}.env`,
            ]
            : []),
        // Load DotEnv Files for a target in the project root
        `${task.projectRoot}/.env.${task.target.target}`,
        `${task.projectRoot}/.${task.target.target}.env`,
        `${task.projectRoot}/.env.local`,
        `${task.projectRoot}/.local.env`,
        `${task.projectRoot}/.env`,
        // Load DotEnv Files for a configuration in the workspace root
        ...(task.target.configuration
            ? [
                `.env.${task.target.target}.${task.target.configuration}`,
                `.env.${task.target.configuration}`,
                `.${task.target.target}.${task.target.configuration}.env`,
                `.${task.target.configuration}.env`,
            ]
            : []),
        // Load DotEnv Files for a target in the workspace root
        `.env.${task.target.target}`,
        `.${task.target.target}.env`,
        // Load base DotEnv Files at workspace root
        `.local.env`,
        `.env.local`,
        `.env`,
    ];
    for (const file of dotEnvFiles) {
        const myEnv = (0, dotenv_1.config)({
            path: file,
            processEnv: environmentVariables,
            // Do not override existing env variables as we load
            override: false,
        });
        environmentVariables = {
            ...(0, dotenv_expand_1.expand)({
                ...myEnv,
                ignoreProcessEnv: true, // Do not override existing env variables as we load
            }).parsed,
            ...environmentVariables,
        };
    }
    return environmentVariables;
}
function unloadDotEnvFiles(environmentVariables) {
    const unloadDotEnvFile = (filename) => {
        let parsedDotEnvFile = {};
        (0, dotenv_1.config)({ path: filename, processEnv: parsedDotEnvFile });
        Object.keys(parsedDotEnvFile).forEach((envVarKey) => {
            if (environmentVariables[envVarKey] === parsedDotEnvFile[envVarKey]) {
                delete environmentVariables[envVarKey];
            }
        });
    };
    for (const file of ['.env', '.local.env', '.env.local']) {
        unloadDotEnvFile(file);
    }
    return environmentVariables;
}
