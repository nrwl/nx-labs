"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetWorkspaceContext = exports.updateProjectFiles = exports.getFilesInDirectoryUsingContext = exports.getAllFileDataInContext = exports.updateFilesInContext = exports.hashWithWorkspaceContext = exports.globWithWorkspaceContext = exports.getNxWorkspaceFilesFromContext = exports.setupWorkspaceContext = void 0;
const perf_hooks_1 = require("perf_hooks");
const cache_directory_1 = require("./cache-directory");
let workspaceContext;
function setupWorkspaceContext(workspaceRoot) {
    const { WorkspaceContext } = require('../native');
    perf_hooks_1.performance.mark('workspace-context');
    workspaceContext = new WorkspaceContext(workspaceRoot, (0, cache_directory_1.cacheDirectoryForWorkspace)(workspaceRoot));
    perf_hooks_1.performance.mark('workspace-context:end');
    perf_hooks_1.performance.measure('workspace context init', 'workspace-context', 'workspace-context:end');
}
exports.setupWorkspaceContext = setupWorkspaceContext;
function getNxWorkspaceFilesFromContext(workspaceRoot, projectRootMap) {
    ensureContextAvailable(workspaceRoot);
    return workspaceContext.getWorkspaceFiles(projectRootMap);
}
exports.getNxWorkspaceFilesFromContext = getNxWorkspaceFilesFromContext;
function globWithWorkspaceContext(workspaceRoot, globs, exclude) {
    ensureContextAvailable(workspaceRoot);
    return workspaceContext.glob(globs, exclude);
}
exports.globWithWorkspaceContext = globWithWorkspaceContext;
function hashWithWorkspaceContext(workspaceRoot, globs, exclude) {
    ensureContextAvailable(workspaceRoot);
    return workspaceContext.hashFilesMatchingGlob(globs, exclude);
}
exports.hashWithWorkspaceContext = hashWithWorkspaceContext;
function updateFilesInContext(updatedFiles, deletedFiles) {
    return workspaceContext?.incrementalUpdate(updatedFiles, deletedFiles);
}
exports.updateFilesInContext = updateFilesInContext;
function getAllFileDataInContext(workspaceRoot) {
    ensureContextAvailable(workspaceRoot);
    return workspaceContext.allFileData();
}
exports.getAllFileDataInContext = getAllFileDataInContext;
function getFilesInDirectoryUsingContext(workspaceRoot, dir) {
    ensureContextAvailable(workspaceRoot);
    return workspaceContext.getFilesInDirectory(dir);
}
exports.getFilesInDirectoryUsingContext = getFilesInDirectoryUsingContext;
function updateProjectFiles(projectRootMappings, rustReferences, updatedFiles, deletedFiles) {
    return workspaceContext?.updateProjectFiles(projectRootMappings, rustReferences.projectFiles, rustReferences.globalFiles, updatedFiles, deletedFiles);
}
exports.updateProjectFiles = updateProjectFiles;
function ensureContextAvailable(workspaceRoot) {
    if (!workspaceContext || workspaceContext?.workspaceRoot !== workspaceRoot) {
        setupWorkspaceContext(workspaceRoot);
    }
}
function resetWorkspaceContext() {
    workspaceContext = undefined;
}
exports.resetWorkspaceContext = resetWorkspaceContext;
