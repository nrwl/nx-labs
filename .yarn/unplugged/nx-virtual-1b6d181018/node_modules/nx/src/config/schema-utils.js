"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveSchema = exports.resolveImplementation = exports.getImplementationFactory = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const nx_plugin_1 = require("../utils/nx-plugin");
/**
 * This function is used to get the implementation factory of an executor or generator.
 * @param implementation path to the implementation
 * @param directory path to the directory
 * @returns a function that returns the implementation
 */
function getImplementationFactory(implementation, directory) {
    const [implementationModulePath, implementationExportName] = implementation.split('#');
    return () => {
        const modulePath = resolveImplementation(implementationModulePath, directory);
        if ((0, path_1.extname)(modulePath) === '.ts') {
            (0, nx_plugin_1.registerPluginTSTranspiler)();
        }
        const module = require(modulePath);
        return implementationExportName
            ? module[implementationExportName]
            : module.default ?? module;
    };
}
exports.getImplementationFactory = getImplementationFactory;
/**
 * This function is used to resolve the implementation of an executor or generator.
 * @param implementationModulePath
 * @param directory
 * @returns path to the implementation
 */
function resolveImplementation(implementationModulePath, directory) {
    const validImplementations = ['', '.js', '.ts'].map((x) => implementationModulePath + x);
    for (const maybeImplementation of validImplementations) {
        const maybeImplementationPath = (0, path_1.join)(directory, maybeImplementation);
        if ((0, fs_1.existsSync)(maybeImplementationPath)) {
            return maybeImplementationPath;
        }
        try {
            return require.resolve(maybeImplementation, {
                paths: [directory],
            });
        }
        catch { }
    }
    throw new Error(`Could not resolve "${implementationModulePath}" from "${directory}".`);
}
exports.resolveImplementation = resolveImplementation;
function resolveSchema(schemaPath, directory) {
    const maybeSchemaPath = (0, path_1.join)(directory, schemaPath);
    if ((0, fs_1.existsSync)(maybeSchemaPath)) {
        return maybeSchemaPath;
    }
    return require.resolve(schemaPath, {
        paths: [directory],
    });
}
exports.resolveSchema = resolveSchema;
