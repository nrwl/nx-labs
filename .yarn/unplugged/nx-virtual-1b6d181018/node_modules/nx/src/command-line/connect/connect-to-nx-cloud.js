"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectExistingRepoToNxCloudPrompt = exports.connectToNxCloudWithPrompt = exports.connectToNxCloudCommand = exports.connectToNxCloudIfExplicitlyAsked = exports.onlyDefaultRunnerIsUsed = void 0;
const output_1 = require("../../utils/output");
const configuration_1 = require("../../config/configuration");
const nx_cloud_utils_1 = require("../../utils/nx-cloud-utils");
const child_process_1 = require("../../utils/child-process");
const ab_testing_1 = require("../../utils/ab-testing");
const versions_1 = require("../../utils/versions");
const chalk = require("chalk");
function onlyDefaultRunnerIsUsed(nxJson) {
    const defaultRunner = nxJson.tasksRunnerOptions?.default?.runner;
    if (!defaultRunner) {
        // No tasks runner options OR no default runner defined:
        // - If access token defined, uses cloud runner
        // - If no access token defined, uses default
        return !(nxJson.nxCloudAccessToken ?? process.env.NX_CLOUD_ACCESS_TOKEN);
    }
    return defaultRunner === 'nx/tasks-runners/default';
}
exports.onlyDefaultRunnerIsUsed = onlyDefaultRunnerIsUsed;
async function connectToNxCloudIfExplicitlyAsked(opts) {
    if (opts['cloud'] === true) {
        const nxJson = (0, configuration_1.readNxJson)();
        if (!onlyDefaultRunnerIsUsed(nxJson))
            return;
        output_1.output.log({
            title: '--cloud requires the workspace to be connected to Nx Cloud.',
        });
        (0, child_process_1.runNxSync)(`connect-to-nx-cloud`, {
            stdio: [0, 1, 2],
        });
        output_1.output.success({
            title: 'Your workspace has been successfully connected to Nx Cloud.',
        });
        process.exit(0);
    }
}
exports.connectToNxCloudIfExplicitlyAsked = connectToNxCloudIfExplicitlyAsked;
async function connectToNxCloudCommand() {
    const nxJson = (0, configuration_1.readNxJson)();
    if ((0, nx_cloud_utils_1.isNxCloudUsed)(nxJson)) {
        output_1.output.log({
            title: '✔ This workspace already has Nx Cloud set up',
            bodyLines: [
                'If you have not done so already, connect your workspace to your Nx Cloud account:',
                `- Login at ${(0, nx_cloud_utils_1.getNxCloudUrl)(nxJson)} to connect your repository`,
            ],
        });
        return false;
    }
    (0, child_process_1.runNxSync)(`g nx:connect-to-nx-cloud --quiet --no-interactive`, {
        stdio: [0, 1, 2],
    });
    return true;
}
exports.connectToNxCloudCommand = connectToNxCloudCommand;
async function connectToNxCloudWithPrompt(command) {
    const setNxCloud = await nxCloudPrompt('setupNxCloud');
    const useCloud = setNxCloud === 'yes' ? await connectToNxCloudCommand() : false;
    await (0, ab_testing_1.recordStat)({
        command,
        nxVersion: versions_1.nxVersion,
        useCloud,
        meta: ab_testing_1.messages.codeOfSelectedPromptMessage('setupNxCloud'),
    });
}
exports.connectToNxCloudWithPrompt = connectToNxCloudWithPrompt;
async function connectExistingRepoToNxCloudPrompt(key = 'setupNxCloud') {
    return nxCloudPrompt(key).then((value) => value === 'yes');
}
exports.connectExistingRepoToNxCloudPrompt = connectExistingRepoToNxCloudPrompt;
async function nxCloudPrompt(key) {
    const { message, choices, initial, footer, hint } = ab_testing_1.messages.getPrompt(key);
    const promptConfig = {
        name: 'NxCloud',
        message,
        type: 'autocomplete',
        choices,
        initial,
    }; // meeroslav: types in enquirer are not up to date
    if (footer) {
        promptConfig.footer = () => chalk.dim(footer);
    }
    if (hint) {
        promptConfig.hint = () => chalk.dim(hint);
    }
    return await (await Promise.resolve().then(() => require('enquirer')))
        .prompt([promptConfig])
        .then((a) => {
        return a.NxCloud;
    });
}
