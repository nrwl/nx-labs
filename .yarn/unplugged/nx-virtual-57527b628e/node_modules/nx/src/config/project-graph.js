"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyType = exports.fileDataDepType = exports.fileDataDepTarget = void 0;
function fileDataDepTarget(dep) {
    return typeof dep === 'string' ? dep : dep[0];
}
exports.fileDataDepTarget = fileDataDepTarget;
function fileDataDepType(dep) {
    return typeof dep === 'string' ? 'static' : dep[1];
}
exports.fileDataDepType = fileDataDepType;
/**
 * Type of dependency between projects
 */
var DependencyType;
(function (DependencyType) {
    /**
     * Static dependencies are tied to the loading of the module
     */
    DependencyType["static"] = "static";
    /**
     * Dynamic dependencies are brought in by the module at run time
     */
    DependencyType["dynamic"] = "dynamic";
    /**
     * Implicit dependencies are inferred
     */
    DependencyType["implicit"] = "implicit";
})(DependencyType || (exports.DependencyType = DependencyType = {}));
