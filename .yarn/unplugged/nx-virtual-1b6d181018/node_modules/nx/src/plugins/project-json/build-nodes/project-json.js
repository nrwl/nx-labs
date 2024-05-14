"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProjectFromProjectJson = exports.ProjectJsonProjectsPlugin = void 0;
const node_path_1 = require("node:path");
const workspaces_1 = require("../../../config/workspaces");
const fileutils_1 = require("../../../utils/fileutils");
exports.ProjectJsonProjectsPlugin = {
    name: 'nx/core/project-json',
    createNodes: [
        '{project.json,**/project.json}',
        (file, _, { workspaceRoot }) => {
            const json = (0, fileutils_1.readJsonFile)((0, node_path_1.join)(workspaceRoot, file));
            const project = buildProjectFromProjectJson(json, file);
            return {
                projects: {
                    [project.root]: project,
                },
            };
        },
    ],
};
function buildProjectFromProjectJson(json, path) {
    return {
        name: (0, workspaces_1.toProjectName)(path),
        root: (0, node_path_1.dirname)(path),
        ...json,
    };
}
exports.buildProjectFromProjectJson = buildProjectFromProjectJson;
