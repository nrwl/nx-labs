"use strict";
/**
 * This file contains the logic to convert pnpm lockfile to a standard format.
 * It will convert inline specifiers to the separate specifiers format and ensure importers are present.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifyToPnpmYaml = exports.parseAndNormalizePnpmLockfile = exports.loadPnpmHoistedDepsDefinition = exports.isV6Lockfile = void 0;
const fs_1 = require("fs");
const workspace_root_1 = require("../../../../utils/workspace-root");
const semver_1 = require("semver");
function isV6Lockfile(data) {
    return data.lockfileVersion.toString().startsWith('6.');
}
exports.isV6Lockfile = isV6Lockfile;
function loadPnpmHoistedDepsDefinition() {
    const fullPath = `${workspace_root_1.workspaceRoot}/node_modules/.modules.yaml`;
    if ((0, fs_1.existsSync)(fullPath)) {
        const content = (0, fs_1.readFileSync)(fullPath, 'utf-8');
        const { load } = require('@zkochan/js-yaml');
        return load(content)?.hoistedDependencies ?? {};
    }
    else {
        throw new Error(`Could not find ".modules.yaml" at "${fullPath}"`);
    }
}
exports.loadPnpmHoistedDepsDefinition = loadPnpmHoistedDepsDefinition;
/*************************************************************************
 * THE FOLLOWING CODE IS COPIED & simplified FROM @pnpm/lockfile-file for convenience
 *************************************************************************/
/**
 * Parsing and mapping logic from pnpm lockfile `read` function
 * https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/read.ts#L91
 */
function parseAndNormalizePnpmLockfile(content) {
    const { load } = require('@zkochan/js-yaml');
    const lockFileData = load(content);
    return revertFromInlineSpecifiersFormatIfNecessary(convertFromLockfileFileMutable(lockFileData));
}
exports.parseAndNormalizePnpmLockfile = parseAndNormalizePnpmLockfile;
/**
 * Reverts changes from the "forceSharedFormat" write option if necessary.
 * https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/read.ts#L234
 */
function convertFromLockfileFileMutable(lockfileFile) {
    if (typeof lockfileFile?.['importers'] === 'undefined') {
        lockfileFile.importers = {
            '.': {
                specifiers: lockfileFile['specifiers'] ?? {},
                dependenciesMeta: lockfileFile['dependenciesMeta'],
                publishDirectory: lockfileFile['publishDirectory'],
            },
        };
        delete lockfileFile.specifiers;
        for (const depType of DEPENDENCIES_FIELDS) {
            if (lockfileFile[depType] != null) {
                lockfileFile.importers['.'][depType] = lockfileFile[depType];
                delete lockfileFile[depType];
            }
        }
    }
    return lockfileFile;
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/write.ts#L27
const LOCKFILE_YAML_FORMAT = {
    blankLines: true,
    lineWidth: 1000,
    noCompatMode: true,
    noRefs: true,
    sortKeys: false,
};
/**
 * Mapping and writing logic from pnpm lockfile `write` function
 * https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/write.ts#L77
 */
function stringifyToPnpmYaml(lockfile) {
    const isLockfileV6 = isV6Lockfile(lockfile);
    const adaptedLockfile = isLockfileV6
        ? convertToInlineSpecifiersFormat(lockfile)
        : lockfile;
    const { dump } = require('@zkochan/js-yaml');
    return dump(sortLockfileKeys(normalizeLockfile(adaptedLockfile, isLockfileV6)), LOCKFILE_YAML_FORMAT);
}
exports.stringifyToPnpmYaml = stringifyToPnpmYaml;
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/write.ts#L106
function normalizeLockfile(lockfile, isLockfileV6) {
    let lockfileToSave;
    if (Object.keys(lockfile.importers).length === 1 && lockfile.importers['.']) {
        lockfileToSave = {
            ...lockfile,
            ...lockfile.importers['.'],
        };
        delete lockfileToSave.importers;
        for (const depType of DEPENDENCIES_FIELDS) {
            if (isEmpty(lockfileToSave[depType])) {
                delete lockfileToSave[depType];
            }
        }
        if (isEmpty(lockfileToSave.packages) || lockfileToSave.packages == null) {
            delete lockfileToSave.packages;
        }
    }
    else {
        lockfileToSave = {
            ...lockfile,
            importers: mapValues(lockfile.importers, (importer) => {
                const normalizedImporter = {};
                if (!isEmpty(importer.specifiers ?? {}) || !isLockfileV6) {
                    normalizedImporter['specifiers'] = importer.specifiers ?? {};
                }
                if (importer.dependenciesMeta != null &&
                    !isEmpty(importer.dependenciesMeta)) {
                    normalizedImporter['dependenciesMeta'] = importer.dependenciesMeta;
                }
                for (const depType of DEPENDENCIES_FIELDS) {
                    if (!isEmpty(importer[depType] ?? {})) {
                        normalizedImporter[depType] = importer[depType];
                    }
                }
                if (importer.publishDirectory) {
                    normalizedImporter.publishDirectory = importer.publishDirectory;
                }
                return normalizedImporter;
            }),
        };
        if (isEmpty(lockfileToSave.packages) || lockfileToSave.packages == null) {
            delete lockfileToSave.packages;
        }
    }
    if (lockfileToSave.time) {
        lockfileToSave.time = (isLockfileV6 ? pruneTimeInLockfileV6 : pruneTime)(lockfileToSave.time, lockfile.importers);
    }
    if (lockfileToSave.overrides != null && isEmpty(lockfileToSave.overrides)) {
        delete lockfileToSave.overrides;
    }
    if (lockfileToSave.patchedDependencies != null &&
        isEmpty(lockfileToSave.patchedDependencies)) {
        delete lockfileToSave.patchedDependencies;
    }
    if (lockfileToSave.neverBuiltDependencies != null) {
        if (isEmpty(lockfileToSave.neverBuiltDependencies)) {
            delete lockfileToSave.neverBuiltDependencies;
        }
        else {
            lockfileToSave.neverBuiltDependencies =
                lockfileToSave.neverBuiltDependencies.sort();
        }
    }
    if (lockfileToSave.onlyBuiltDependencies != null) {
        lockfileToSave.onlyBuiltDependencies =
            lockfileToSave.onlyBuiltDependencies.sort();
    }
    if (!lockfileToSave.packageExtensionsChecksum) {
        delete lockfileToSave.packageExtensionsChecksum;
    }
    return lockfileToSave;
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/write.ts#L173
function pruneTimeInLockfileV6(time, importers) {
    const rootDepPaths = new Set();
    for (const importer of Object.values(importers)) {
        for (const depType of DEPENDENCIES_FIELDS) {
            for (let [depName, ref] of Object.entries(importer[depType] ?? {})) {
                let version;
                if (ref['version']) {
                    version = ref['version'];
                }
                else {
                    version = ref;
                }
                const suffixStart = version.indexOf('(');
                const refWithoutPeerSuffix = suffixStart === -1 ? version : version.slice(0, suffixStart);
                const depPath = refToRelative(refWithoutPeerSuffix, depName);
                if (!depPath)
                    continue;
                rootDepPaths.add(depPath);
            }
        }
    }
    return pickBy((prop) => rootDepPaths.has(prop), time);
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/write.ts#L191
function refToRelative(reference, pkgName) {
    if (reference.startsWith('link:')) {
        return null;
    }
    if (reference.startsWith('file:')) {
        return reference;
    }
    if (!reference.includes('/') ||
        !reference.replace(/(\([^)]+\))+$/, '').includes('/')) {
        return `/${pkgName}@${reference}`;
    }
    return reference;
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/write.ts#L207
function pruneTime(time, importers) {
    const rootDepPaths = new Set();
    for (const importer of Object.values(importers)) {
        for (const depType of DEPENDENCIES_FIELDS) {
            for (let [depName, ref] of Object.entries(importer[depType] ?? {})) {
                let version;
                if (ref['version']) {
                    version = ref['version'];
                }
                else {
                    version = ref;
                }
                const suffixStart = version.indexOf('_');
                const refWithoutPeerSuffix = suffixStart === -1 ? version : version.slice(0, suffixStart);
                const depPath = dpRefToRelative(refWithoutPeerSuffix, depName);
                if (!depPath)
                    continue;
                rootDepPaths.add(depPath);
            }
        }
    }
    return pickBy((depPath) => rootDepPaths.has(depPath), time);
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/sortLockfileKeys.ts#L34
const ROOT_KEYS_ORDER = {
    lockfileVersion: 1,
    // only and never are conflict options.
    neverBuiltDependencies: 2,
    onlyBuiltDependencies: 2,
    overrides: 3,
    packageExtensionsChecksum: 4,
    patchedDependencies: 5,
    specifiers: 10,
    dependencies: 11,
    optionalDependencies: 12,
    devDependencies: 13,
    dependenciesMeta: 14,
    importers: 15,
    packages: 16,
};
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/sortLockfileKeys.ts#L60
function sortLockfileKeys(lockfile) {
    let sortedLockfile = {};
    const sortedKeys = Object.keys(lockfile).sort((a, b) => ROOT_KEYS_ORDER[a] - ROOT_KEYS_ORDER[b]);
    for (const key of sortedKeys) {
        sortedLockfile[key] = lockfile[key];
    }
    return sortedLockfile;
}
/**
 * Types from https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/experiments/InlineSpecifiersLockfile.ts
 */
const INLINE_SPECIFIERS_FORMAT_LOCKFILE_VERSION_SUFFIX = '-inlineSpecifiers';
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/experiments/inlineSpecifiersLockfileConverters.ts#L10
function isExperimentalInlineSpecifiersFormat(lockfile) {
    const { lockfileVersion } = lockfile;
    return (lockfileVersion.toString().startsWith('6.') ||
        (typeof lockfileVersion === 'string' &&
            lockfileVersion.endsWith(INLINE_SPECIFIERS_FORMAT_LOCKFILE_VERSION_SUFFIX)));
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/experiments/inlineSpecifiersLockfileConverters.ts#L17
function convertToInlineSpecifiersFormat(lockfile) {
    let importers = lockfile.importers;
    let packages = lockfile.packages;
    if (isV6Lockfile(lockfile)) {
        importers = Object.fromEntries(Object.entries(lockfile.importers ?? {}).map(([importerId, pkgSnapshot]) => {
            const newSnapshot = { ...pkgSnapshot };
            if (newSnapshot.dependencies != null) {
                newSnapshot.dependencies = mapValues(newSnapshot.dependencies, convertOldRefToNewRef);
            }
            if (newSnapshot.optionalDependencies != null) {
                newSnapshot.optionalDependencies = mapValues(newSnapshot.optionalDependencies, convertOldRefToNewRef);
            }
            if (newSnapshot.devDependencies != null) {
                newSnapshot.devDependencies = mapValues(newSnapshot.devDependencies, convertOldRefToNewRef);
            }
            return [importerId, newSnapshot];
        }));
        packages = Object.fromEntries(Object.entries(lockfile.packages ?? {}).map(([depPath, pkgSnapshot]) => {
            const newSnapshot = { ...pkgSnapshot };
            if (newSnapshot.dependencies != null) {
                newSnapshot.dependencies = mapValues(newSnapshot.dependencies, convertOldRefToNewRef);
            }
            if (newSnapshot.optionalDependencies != null) {
                newSnapshot.optionalDependencies = mapValues(newSnapshot.optionalDependencies, convertOldRefToNewRef);
            }
            return [convertOldDepPathToNewDepPath(depPath), newSnapshot];
        }));
    }
    const newLockfile = {
        ...lockfile,
        packages,
        lockfileVersion: isV6Lockfile(lockfile)
            ? lockfile.lockfileVersion.toString()
            : lockfile.lockfileVersion
                .toString()
                .endsWith(INLINE_SPECIFIERS_FORMAT_LOCKFILE_VERSION_SUFFIX)
                ? lockfile.lockfileVersion.toString()
                : `${lockfile.lockfileVersion}${INLINE_SPECIFIERS_FORMAT_LOCKFILE_VERSION_SUFFIX}`,
        importers: mapValues(importers, convertProjectSnapshotToInlineSpecifiersFormat),
    };
    if (isV6Lockfile(lockfile) && newLockfile.time) {
        newLockfile.time = Object.fromEntries(Object.entries(newLockfile.time).map(([depPath, time]) => [
            convertOldDepPathToNewDepPath(depPath),
            time,
        ]));
    }
    return newLockfile;
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/experiments/inlineSpecifiersLockfileConverters.ts#L72
function convertOldDepPathToNewDepPath(oldDepPath) {
    const parsedDepPath = dpParse(oldDepPath);
    if (!parsedDepPath.name || !parsedDepPath.version)
        return oldDepPath;
    let newDepPath = `/${parsedDepPath.name}@${parsedDepPath.version}`;
    if (parsedDepPath.peersSuffix) {
        if (parsedDepPath.peersSuffix.startsWith('(')) {
            newDepPath += parsedDepPath.peersSuffix;
        }
        else {
            newDepPath += `_${parsedDepPath.peersSuffix}`;
        }
    }
    if (parsedDepPath.host) {
        newDepPath = `${parsedDepPath.host}${newDepPath}`;
    }
    return newDepPath;
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/experiments/inlineSpecifiersLockfileConverters.ts#L89
function convertOldRefToNewRef(oldRef) {
    if (oldRef.startsWith('link:') || oldRef.startsWith('file:')) {
        return oldRef;
    }
    if (oldRef.includes('/')) {
        return convertOldDepPathToNewDepPath(oldRef);
    }
    return oldRef;
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/experiments/inlineSpecifiersLockfileConverters.ts#L99
function revertFromInlineSpecifiersFormatIfNecessary(lockfile) {
    return isExperimentalInlineSpecifiersFormat(lockfile)
        ? revertFromInlineSpecifiersFormat(lockfile)
        : lockfile;
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/experiments/inlineSpecifiersLockfileConverters.ts#L105
function revertFromInlineSpecifiersFormat(lockfile) {
    const { lockfileVersion, importers, ...rest } = lockfile;
    const originalVersionStr = lockfileVersion.replace(INLINE_SPECIFIERS_FORMAT_LOCKFILE_VERSION_SUFFIX, '');
    const originalVersion = Number(originalVersionStr);
    if (isNaN(originalVersion)) {
        throw new Error(`Unable to revert lockfile from inline specifiers format. Invalid version parsed: ${originalVersionStr}`);
    }
    let revertedImporters = mapValues(importers, revertProjectSnapshot);
    let packages = lockfile.packages;
    if (originalVersionStr.startsWith('6.')) {
        revertedImporters = Object.fromEntries(Object.entries(revertedImporters ?? {}).map(([importerId, pkgSnapshot]) => {
            const newSnapshot = { ...pkgSnapshot };
            if (newSnapshot.dependencies != null) {
                newSnapshot.dependencies = mapValues(newSnapshot.dependencies, convertNewRefToOldRef);
            }
            if (newSnapshot.optionalDependencies != null) {
                newSnapshot.optionalDependencies = mapValues(newSnapshot.optionalDependencies, convertNewRefToOldRef);
            }
            if (newSnapshot.devDependencies != null) {
                newSnapshot.devDependencies = mapValues(newSnapshot.devDependencies, convertNewRefToOldRef);
            }
            return [importerId, newSnapshot];
        }));
        packages = Object.fromEntries(Object.entries(lockfile.packages ?? {}).map(([depPath, pkgSnapshot]) => {
            const newSnapshot = { ...pkgSnapshot };
            if (newSnapshot.dependencies != null) {
                newSnapshot.dependencies = mapValues(newSnapshot.dependencies, convertNewRefToOldRef);
            }
            if (newSnapshot.optionalDependencies != null) {
                newSnapshot.optionalDependencies = mapValues(newSnapshot.optionalDependencies, convertNewRefToOldRef);
            }
            return [convertNewDepPathToOldDepPath(depPath), newSnapshot];
        }));
    }
    const newLockfile = {
        ...rest,
        lockfileVersion: lockfileVersion.endsWith(INLINE_SPECIFIERS_FORMAT_LOCKFILE_VERSION_SUFFIX)
            ? originalVersion
            : lockfileVersion,
        packages,
        importers: revertedImporters,
    };
    if (originalVersionStr.startsWith('6.') && newLockfile.time) {
        newLockfile.time = Object.fromEntries(Object.entries(newLockfile.time).map(([depPath, time]) => [
            convertNewDepPathToOldDepPath(depPath),
            time,
        ]));
    }
    return newLockfile;
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/experiments/inlineSpecifiersLockfileConverters.ts#L162
function convertNewDepPathToOldDepPath(oldDepPath) {
    if (!oldDepPath.includes('@', 2))
        return oldDepPath;
    const index = oldDepPath.indexOf('@', oldDepPath.indexOf('/@') + 2);
    if (oldDepPath.includes('(') && index > oldDepPath.indexOf('('))
        return oldDepPath;
    return `${oldDepPath.substring(0, index)}/${oldDepPath.substring(index + 1)}`;
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/experiments/inlineSpecifiersLockfileConverters.ts#L169
function convertNewRefToOldRef(oldRef) {
    if (oldRef.startsWith('link:') || oldRef.startsWith('file:')) {
        return oldRef;
    }
    if (oldRef.includes('@')) {
        return convertNewDepPathToOldDepPath(oldRef);
    }
    return oldRef;
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/experiments/inlineSpecifiersLockfileConverters.ts#L179
function convertProjectSnapshotToInlineSpecifiersFormat(projectSnapshot) {
    const { specifiers, ...rest } = projectSnapshot;
    const convertBlock = (block) => block != null
        ? convertResolvedDependenciesToInlineSpecifiersFormat(block, {
            specifiers,
        })
        : block;
    return {
        ...rest,
        dependencies: convertBlock(projectSnapshot.dependencies),
        optionalDependencies: convertBlock(projectSnapshot.optionalDependencies),
        devDependencies: convertBlock(projectSnapshot.devDependencies),
    };
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/experiments/inlineSpecifiersLockfileConverters.ts#L195
function convertResolvedDependenciesToInlineSpecifiersFormat(resolvedDependencies, { specifiers }) {
    return mapValues(resolvedDependencies, (version, depName) => ({
        specifier: specifiers[depName],
        version,
    }));
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/experiments/inlineSpecifiersLockfileConverters.ts#L205
function revertProjectSnapshot(from) {
    const specifiers = {};
    function moveSpecifiers(from) {
        const resolvedDependencies = {};
        for (const [depName, { specifier, version }] of Object.entries(from)) {
            const existingValue = specifiers[depName];
            if (existingValue != null && existingValue !== specifier) {
                throw new Error(`Project snapshot lists the same dependency more than once with conflicting versions: ${depName}`);
            }
            specifiers[depName] = specifier;
            resolvedDependencies[depName] = version;
        }
        return resolvedDependencies;
    }
    const dependencies = from.dependencies
        ? moveSpecifiers(from.dependencies)
        : null;
    const devDependencies = from.devDependencies
        ? moveSpecifiers(from.devDependencies)
        : null;
    const optionalDependencies = from.optionalDependencies
        ? moveSpecifiers(from.optionalDependencies)
        : null;
    return {
        ...from,
        specifiers,
        dependencies,
        devDependencies,
        optionalDependencies,
    };
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/experiments/inlineSpecifiersLockfileConverters.ts#L241
function mapValues(obj, mapper) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = mapper(value, key);
    }
    return result;
}
/*************************************************************************
 * THE FOLLOWING CODE IS COPIED FROM @pnpm/types for convenience
 *************************************************************************/
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/packages/types/src/misc.ts#L6
const DEPENDENCIES_FIELDS = [
    'optionalDependencies',
    'dependencies',
    'devDependencies',
];
/*************************************************************************
 * THE FOLLOWING CODE IS COPIED FROM @pnpm/dependency-path for convenience
 *************************************************************************/
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/packages/dependency-path/src/index.ts#L6
function isAbsolute(dependencyPath) {
    return dependencyPath[0] !== '/';
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/packages/dependency-path/src/index.ts#L80
function dpRefToRelative(reference, pkgName) {
    if (reference.startsWith('link:')) {
        return null;
    }
    if (reference.startsWith('file:')) {
        return reference;
    }
    if (!reference.includes('/') ||
        (reference.includes('(') &&
            reference.lastIndexOf('/', reference.indexOf('(')) === -1)) {
        return `/${pkgName}/${reference}`;
    }
    return reference;
}
// https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/packages/dependency-path/src/index.ts#L96
function dpParse(dependencyPath) {
    // eslint-disable-next-line: strict-type-predicates
    if (typeof dependencyPath !== 'string') {
        throw new TypeError(`Expected \`dependencyPath\` to be of type \`string\`, got \`${
        // eslint-disable-next-line: strict-type-predicates
        dependencyPath === null ? 'null' : typeof dependencyPath}\``);
    }
    const _isAbsolute = isAbsolute(dependencyPath);
    const parts = dependencyPath.split('/');
    if (!_isAbsolute)
        parts.shift();
    const host = _isAbsolute ? parts.shift() : undefined;
    if (parts.length === 0)
        return {
            host,
            isAbsolute: _isAbsolute,
        };
    const name = parts[0].startsWith('@')
        ? `${parts.shift()}/${parts.shift()}` // eslint-disable-line @typescript-eslint/restrict-template-expressions
        : parts.shift();
    let version = parts.join('/');
    if (version) {
        let peerSepIndex;
        let peersSuffix;
        if (version.includes('(') && version.endsWith(')')) {
            peerSepIndex = version.indexOf('(');
            if (peerSepIndex !== -1) {
                peersSuffix = version.substring(peerSepIndex);
                version = version.substring(0, peerSepIndex);
            }
        }
        else {
            peerSepIndex = version.indexOf('_');
            if (peerSepIndex !== -1) {
                peersSuffix = version.substring(peerSepIndex + 1);
                version = version.substring(0, peerSepIndex);
            }
        }
        if ((0, semver_1.valid)(version)) {
            return {
                host,
                isAbsolute: _isAbsolute,
                name,
                peersSuffix,
                version,
            };
        }
    }
    if (!_isAbsolute)
        throw new Error(`${dependencyPath} is an invalid relative dependency path`);
    return {
        host,
        isAbsolute: _isAbsolute,
    };
}
/********************************************************************************
 * THE FOLLOWING CODE IS COPIED AND SIMPLIFIED FROM @pnpm/ramda for convenience
 *******************************************************************************/
// https://github.com/pnpm/ramda/blob/50c6b57110b2f3631ed8633141f12012b7768d85/source/pickBy.js#L24
function pickBy(test, obj) {
    let result = {};
    for (const prop in obj) {
        if (test(obj[prop])) {
            result[prop] = obj[prop];
        }
    }
    return result;
}
// https://github.com/pnpm/ramda/blob/50c6b57110b2f3631ed8633141f12012b7768d85/source/isEmpty.js#L28
function isEmpty(obj) {
    return obj != null && Object.keys(obj).length === 0;
}
