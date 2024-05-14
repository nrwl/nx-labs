"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugLog = void 0;
function debugLog(...args) {
    if (process.env['NX_VERBOSE_LOGGING'] === 'true') {
        console.log('[NX CLOUD]', ...args);
    }
}
exports.debugLog = debugLog;
