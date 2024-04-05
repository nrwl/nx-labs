"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageJsonProjectsNextToProjectJsonPlugin = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const fileutils_1 = require("../../../utils/fileutils");
const package_json_1 = require("../../../utils/package-json");
// TODO: Remove this one day, this should not need to be done.
exports.PackageJsonProjectsNextToProjectJsonPlugin = {
    // Its not a problem if plugins happen to have same name, and this
    // will look least confusing in the source map.
    name: 'nx/core/package-json',
    createNodes: [
        '{project.json,**/project.json}',
        (file, _, { workspaceRoot }) => {
            const project = createProjectFromPackageJsonNextToProjectJson(file, workspaceRoot);
            return project
                ? {
                    projects: {
                        [project.name]: project,
                    },
                }
                : {};
        },
    ],
};
function createProjectFromPackageJsonNextToProjectJson(projectJsonPath, workspaceRoot) {
    const root = (0, path_1.dirname)(projectJsonPath);
    const packageJsonPath = (0, path_1.join)(workspaceRoot, root, 'package.json');
    if (!(0, fs_1.existsSync)(packageJsonPath)) {
        return null;
    }
    try {
        const packageJson = (0, fileutils_1.readJsonFile)(packageJsonPath);
        let { nx, name } = packageJson;
        return {
            ...nx,
            name,
            root,
            targets: (0, package_json_1.readTargetsFromPackageJson)(packageJson),
        };
    }
    catch (e) {
        console.log(e);
        return null;
    }
}
