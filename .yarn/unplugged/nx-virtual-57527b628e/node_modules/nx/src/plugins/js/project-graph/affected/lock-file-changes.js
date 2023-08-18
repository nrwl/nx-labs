"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTouchedProjectsFromLockFile = void 0;
const getTouchedProjectsFromLockFile = (fileChanges, projectGraphNodes) => {
    const lockFiles = [
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        'pnpm-lock.yml',
    ];
    if (fileChanges.some((f) => lockFiles.includes(f.file))) {
        return Object.values(projectGraphNodes).map((p) => p.name);
    }
    return [];
};
exports.getTouchedProjectsFromLockFile = getTouchedProjectsFromLockFile;
