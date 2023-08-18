"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineGlobPatterns = void 0;
function combineGlobPatterns(...patterns) {
    const p = patterns.flat();
    return p.length > 1 ? '{' + p.join(',') + '}' : p.length === 1 ? p[0] : '';
}
exports.combineGlobPatterns = combineGlobPatterns;
