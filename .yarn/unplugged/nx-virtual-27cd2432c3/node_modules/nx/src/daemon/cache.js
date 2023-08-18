"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDaemonProcessIdSync = exports.safelyCleanUpExistingProcess = exports.writeDaemonJsonProcessCache = exports.deleteDaemonJsonProcessCache = exports.readDaemonProcessJsonCache = exports.serverProcessJsonPath = void 0;
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const tmp_dir_1 = require("./tmp-dir");
exports.serverProcessJsonPath = (0, path_1.join)(tmp_dir_1.DAEMON_DIR_FOR_CURRENT_WORKSPACE, 'server-process.json');
async function readDaemonProcessJsonCache() {
    if (!(0, fs_extra_1.existsSync)(exports.serverProcessJsonPath)) {
        return null;
    }
    return await (0, fs_extra_1.readJson)(exports.serverProcessJsonPath);
}
exports.readDaemonProcessJsonCache = readDaemonProcessJsonCache;
function deleteDaemonJsonProcessCache() {
    try {
        if (getDaemonProcessIdSync() === process.pid) {
            (0, fs_extra_1.unlinkSync)(exports.serverProcessJsonPath);
        }
    }
    catch { }
}
exports.deleteDaemonJsonProcessCache = deleteDaemonJsonProcessCache;
async function writeDaemonJsonProcessCache(daemonJson) {
    await (0, fs_extra_1.writeJson)(exports.serverProcessJsonPath, daemonJson);
}
exports.writeDaemonJsonProcessCache = writeDaemonJsonProcessCache;
async function safelyCleanUpExistingProcess() {
    const daemonProcessJson = await readDaemonProcessJsonCache();
    if (daemonProcessJson && daemonProcessJson.processId) {
        try {
            process.kill(daemonProcessJson.processId);
        }
        catch { }
    }
    deleteDaemonJsonProcessCache();
}
exports.safelyCleanUpExistingProcess = safelyCleanUpExistingProcess;
// Must be sync for the help output use case
function getDaemonProcessIdSync() {
    if (!(0, fs_extra_1.existsSync)(exports.serverProcessJsonPath)) {
        return null;
    }
    try {
        const daemonProcessJson = (0, fs_extra_1.readJsonSync)(exports.serverProcessJsonPath);
        return daemonProcessJson.processId;
    }
    catch {
        return null;
    }
}
exports.getDaemonProcessIdSync = getDaemonProcessIdSync;
