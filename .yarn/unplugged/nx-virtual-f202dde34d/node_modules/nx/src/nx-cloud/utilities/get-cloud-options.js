"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCloudOptions = void 0;
const nx_json_1 = require("../../config/nx-json");
const run_command_1 = require("../../tasks-runner/run-command");
function getCloudOptions() {
    const nxJson = (0, nx_json_1.readNxJson)();
    // TODO: The default is not always cloud? But it's not handled at the moment
    return (0, run_command_1.getRunnerOptions)('default', nxJson, {}, true);
}
exports.getCloudOptions = getCloudOptions;
