"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disableOutputsTracking = exports.processFileChangesInOutputs = exports.outputsHashesMatch = exports.recordOutputsHash = exports.recordedHash = exports._outputsHashesMatch = exports._recordOutputsHash = void 0;
const path_1 = require("path");
const native_1 = require("../../native");
const collapse_expanded_outputs_1 = require("../../utils/collapse-expanded-outputs");
const workspace_root_1 = require("../../utils/workspace-root");
let disabled = false;
const dirsContainingOutputs = {};
const recordedHashes = {};
const timestamps = {};
const numberOfExpandedOutputs = {};
function _recordOutputsHash(outputs, hash) {
    numberOfExpandedOutputs[hash] = outputs.length;
    for (const output of outputs) {
        recordedHashes[output] = hash;
        timestamps[output] = new Date().getTime();
        let current = output;
        while (current != (0, path_1.dirname)(current)) {
            if (!dirsContainingOutputs[current]) {
                dirsContainingOutputs[current] = new Set();
            }
            dirsContainingOutputs[current].add(output);
            current = (0, path_1.dirname)(current);
        }
    }
}
exports._recordOutputsHash = _recordOutputsHash;
function _outputsHashesMatch(outputs, hash) {
    if (outputs.length !== numberOfExpandedOutputs[hash]) {
        return false;
    }
    else {
        for (const output of outputs) {
            if (recordedHashes[output] !== hash) {
                return false;
            }
        }
    }
    return true;
}
exports._outputsHashesMatch = _outputsHashesMatch;
function recordedHash(output) {
    return recordedHashes[output];
}
exports.recordedHash = recordedHash;
async function recordOutputsHash(_outputs, hash) {
    const outputs = await normalizeOutputs(_outputs);
    if (disabled)
        return;
    _recordOutputsHash(outputs, hash);
}
exports.recordOutputsHash = recordOutputsHash;
async function outputsHashesMatch(_outputs, hash) {
    const outputs = await normalizeOutputs(_outputs);
    if (disabled)
        return false;
    return _outputsHashesMatch(outputs, hash);
}
exports.outputsHashesMatch = outputsHashesMatch;
async function normalizeOutputs(outputs) {
    let expandedOutputs = (0, collapse_expanded_outputs_1.collapseExpandedOutputs)((0, native_1.getFilesForOutputs)(workspace_root_1.workspaceRoot, outputs));
    return expandedOutputs;
}
function processFileChangesInOutputs(changeEvents, now = undefined) {
    if (!now) {
        now = new Date().getTime();
    }
    for (let e of changeEvents) {
        let current = e.path;
        // the path is either an output itself or a parent
        if (dirsContainingOutputs[current]) {
            dirsContainingOutputs[current].forEach((output) => {
                if (now - timestamps[output] > 2000) {
                    recordedHashes[output] = undefined;
                }
            });
            continue;
        }
        // the path is a child of some output or unrelated
        while (current != (0, path_1.dirname)(current)) {
            if (recordedHashes[current] && now - timestamps[current] > 2000) {
                recordedHashes[current] = undefined;
                break;
            }
            current = (0, path_1.dirname)(current);
        }
    }
}
exports.processFileChangesInOutputs = processFileChangesInOutputs;
function disableOutputsTracking() {
    disabled = true;
}
exports.disableOutputsTracking = disableOutputsTracking;
