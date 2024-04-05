"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const project_graph_1 = require("../src/project-graph/project-graph");
const workspace_root_1 = require("../src/utils/workspace-root");
const fileutils_1 = require("../src/utils/fileutils");
const path_1 = require("path");
const client_1 = require("../src/daemon/client/client");
const assert_supported_platform_1 = require("../src/native/assert-supported-platform");
const update_manager_1 = require("../src/nx-cloud/update-manager");
const get_cloud_options_1 = require("../src/nx-cloud/utilities/get-cloud-options");
const nx_cloud_utils_1 = require("../src/utils/nx-cloud-utils");
const nx_json_1 = require("../src/config/nx-json");
const workspace_context_1 = require("../src/utils/workspace-context");
(async () => {
    try {
        (0, workspace_context_1.setupWorkspaceContext)(workspace_root_1.workspaceRoot);
        if (isMainNxPackage() && (0, fileutils_1.fileExists)((0, path_1.join)(workspace_root_1.workspaceRoot, 'nx.json'))) {
            const b = new Date();
            (0, assert_supported_platform_1.assertSupportedPlatform)();
            try {
                await client_1.daemonClient.stop();
            }
            catch (e) { }
            const tasks = [
                (0, project_graph_1.buildProjectGraphAndSourceMapsWithoutDaemon)(),
            ];
            if ((0, nx_cloud_utils_1.isNxCloudUsed)((0, nx_json_1.readNxJson)())) {
                tasks.push((0, update_manager_1.verifyOrUpdateNxCloudClient)((0, get_cloud_options_1.getCloudOptions)()));
            }
            await Promise.all(tasks.map((promise) => {
                promise.catch((e) => {
                    if (process.env.NX_VERBOSE_LOGGING === 'true') {
                        console.warn(e);
                    }
                });
            }));
            if (process.env.NX_VERBOSE_LOGGING === 'true') {
                const a = new Date();
                console.log(`Nx postinstall steps took ${a.getTime() - b.getTime()}ms`);
            }
        }
    }
    catch (e) {
        if (process.env.NX_VERBOSE_LOGGING === 'true') {
            console.log(e);
        }
    }
})();
function isMainNxPackage() {
    const mainNxPath = require.resolve('nx', {
        paths: [workspace_root_1.workspaceRoot],
    });
    const thisNxPath = require.resolve('nx');
    return mainNxPath === thisNxPath;
}
