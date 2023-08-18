"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allFileData = void 0;
const client_1 = require("../daemon/client/client");
const file_hasher_1 = require("../hasher/file-hasher");
function allFileData() {
    if (client_1.daemonClient.enabled()) {
        return client_1.daemonClient.getAllFileData();
    }
    else {
        file_hasher_1.fileHasher.ensureInitialized();
        return Promise.resolve(file_hasher_1.fileHasher.allFileData());
    }
}
exports.allFileData = allFileData;
