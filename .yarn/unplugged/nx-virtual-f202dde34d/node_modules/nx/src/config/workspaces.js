"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toProjectName = exports.Workspaces = void 0;
const path_1 = require("path");
const project_graph_1 = require("../project-graph/project-graph");
const nx_json_1 = require("./nx-json");
// TODO(v19): remove this class
/**
 * @deprecated This will be removed in v19. Use {@link readProjectsConfigurationFromProjectGraph} instead.
 */
class Workspaces {
    constructor(root) {
        this.root = root;
    }
    /**
     * @deprecated Use {@link readProjectsConfigurationFromProjectGraph} instead.
     */
    readWorkspaceConfiguration() {
        const nxJson = (0, nx_json_1.readNxJson)(this.root);
        return {
            ...(0, project_graph_1.readProjectsConfigurationFromProjectGraph)((0, project_graph_1.readCachedProjectGraph)()),
            ...nxJson,
        };
    }
}
exports.Workspaces = Workspaces;
/**
 * Pulled from toFileName in names from @nx/devkit.
 * Todo: Should refactor, not duplicate.
 */
function toProjectName(fileName) {
    const parts = (0, path_1.dirname)(fileName).split(/[\/\\]/g);
    return parts[parts.length - 1].toLowerCase();
}
exports.toProjectName = toProjectName;
