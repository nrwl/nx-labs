"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allFileData = void 0;
const client_1 = require("../daemon/client/client");
const workspace_context_1 = require("./workspace-context");
const workspace_root_1 = require("./workspace-root");
function allFileData() {
    if (client_1.daemonClient.enabled()) {
        return client_1.daemonClient.getAllFileData();
    }
    else {
        return Promise.resolve((0, workspace_context_1.getAllFileDataInContext)(workspace_root_1.workspaceRoot));
    }
}
exports.allFileData = allFileData;
