"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRequestFileData = void 0;
const workspace_context_1 = require("../../utils/workspace-context");
const workspace_root_1 = require("../../utils/workspace-root");
async function handleRequestFileData() {
    const response = JSON.stringify((0, workspace_context_1.getAllFileDataInContext)(workspace_root_1.workspaceRoot));
    return {
        response,
        description: 'handleRequestFileData',
    };
}
exports.handleRequestFileData = handleRequestFileData;
