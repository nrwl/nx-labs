"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleOutputsHashesMatch = exports.handleRecordOutputsHash = void 0;
const outputs_tracking_1 = require("./outputs-tracking");
async function handleRecordOutputsHash(payload) {
    try {
        await (0, outputs_tracking_1.recordOutputsHash)(payload.data.outputs, payload.data.hash);
        return {
            description: 'recordOutputsHash',
            response: '{}',
        };
    }
    catch (e) {
        return {
            description: 'recordOutputsHash failed',
            error: new Error(`Critical error when recording metadata about outputs: '${e.message}'.`),
        };
    }
}
exports.handleRecordOutputsHash = handleRecordOutputsHash;
async function handleOutputsHashesMatch(payload) {
    try {
        const res = await (0, outputs_tracking_1.outputsHashesMatch)(payload.data.outputs, payload.data.hash);
        return {
            response: JSON.stringify(res),
            description: 'outputsHashesMatch',
        };
    }
    catch (e) {
        return {
            description: 'outputsHashesMatch failed',
            error: new Error(`Critical error when verifying the contents of the outputs haven't changed: '${e.message}'.`),
        };
    }
}
exports.handleOutputsHashesMatch = handleOutputsHashesMatch;
