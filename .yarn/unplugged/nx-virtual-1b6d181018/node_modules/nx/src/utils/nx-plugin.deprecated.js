"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultPluginsSync = void 0;
const angular_json_1 = require("../adapter/angular-json");
const project_json_1 = require("../plugins/project-json/build-nodes/project-json");
const target_defaults_plugin_1 = require("../plugins/target-defaults/target-defaults-plugin");
const package_json_workspaces_1 = require("../plugins/package-json-workspaces");
/**
 * @todo(@agentender) v19: Remove this fn when we remove readWorkspaceConfig
 */
function getDefaultPluginsSync(root) {
    const plugins = [
        require('../plugins/js'),
        ...((0, angular_json_1.shouldMergeAngularProjects)(root, false)
            ? [require('../adapter/angular-json').NxAngularJsonPlugin]
            : []),
        target_defaults_plugin_1.TargetDefaultsPlugin,
        (0, package_json_workspaces_1.getNxPackageJsonWorkspacesPlugin)(root),
        project_json_1.ProjectJsonProjectsPlugin,
    ];
    return plugins.map((p) => ({
        plugin: p,
    }));
}
exports.getDefaultPluginsSync = getDefaultPluginsSync;
