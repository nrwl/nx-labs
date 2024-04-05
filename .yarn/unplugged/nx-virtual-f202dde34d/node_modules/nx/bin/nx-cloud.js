#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resolution_helpers_1 = require("../src/nx-cloud/resolution-helpers");
const get_cloud_options_1 = require("../src/nx-cloud/utilities/get-cloud-options");
const update_manager_1 = require("../src/nx-cloud/update-manager");
const output_1 = require("../src/utils/output");
const command = process.argv[2];
const options = (0, get_cloud_options_1.getCloudOptions)();
Promise.resolve().then(async () => invokeCommandWithNxCloudClient(options));
async function invokeCommandWithNxCloudClient(options) {
    try {
        const { nxCloudClient } = await (0, update_manager_1.verifyOrUpdateNxCloudClient)(options);
        const paths = (0, resolution_helpers_1.findAncestorNodeModules)(__dirname, []);
        nxCloudClient.configureLightClientRequire()(paths);
        if (command in nxCloudClient.commands) {
            nxCloudClient.commands[command]()
                .then(() => process.exit(0))
                .catch((e) => {
                console.error(e);
                process.exit(1);
            });
        }
        else {
            output_1.output.error({
                title: `Unknown Command "${command}"`,
            });
            output_1.output.log({
                title: 'Available Commands:',
                bodyLines: Object.keys(nxCloudClient.commands).map((c) => `- ${c}`),
            });
            process.exit(1);
        }
    }
    catch (e) {
        const body = ['Cannot run commands from the `nx-cloud` CLI.'];
        if (e instanceof update_manager_1.NxCloudEnterpriseOutdatedError) {
            try {
                // TODO: Remove this when all enterprise customers have updated.
                // Try requiring the bin from the `nx-cloud` package.
                return require('nx-cloud/bin/nx-cloud');
            }
            catch { }
            body.push('If you are an Nx Enterprise customer, please reach out to your assigned Developer Productivity Engineer.', 'If you are NOT an Nx Enterprise customer but are seeing this message, please reach out to cloud-support@nrwl.io.');
        }
        if (e instanceof update_manager_1.NxCloudClientUnavailableError) {
            body.unshift('You may be offline. Please try again when you are back online.');
        }
        output_1.output.error({
            title: e.message,
            bodyLines: body,
        });
        process.exit(1);
    }
}
