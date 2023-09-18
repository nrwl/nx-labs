/**
 * This file contains the logic to convert pnpm lockfile to a standard format.
 * It will convert inline specifiers to the separate specifiers format and ensure importers are present.
 */
import type { Lockfile, ProjectSnapshot } from '@pnpm/lockfile-types';
export declare function isV6Lockfile(data: InlineSpecifiersLockfile | Lockfile): boolean;
export declare function loadPnpmHoistedDepsDefinition(): any;
/*************************************************************************
 * THE FOLLOWING CODE IS COPIED & simplified FROM @pnpm/lockfile-file for convenience
 *************************************************************************/
/**
 * Parsing and mapping logic from pnpm lockfile `read` function
 * https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/read.ts#L91
 */
export declare function parseAndNormalizePnpmLockfile(content: string): Lockfile;
/**
 * Mapping and writing logic from pnpm lockfile `write` function
 * https://github.com/pnpm/pnpm/blob/af3e5559d377870d4c3d303429b3ed1a4e64fedc/lockfile/lockfile-file/src/write.ts#L77
 */
export declare function stringifyToPnpmYaml(lockfile: Lockfile): string;
interface InlineSpecifiersLockfile extends Omit<Lockfile, 'lockfileVersion' | 'importers'> {
    lockfileVersion: string;
    importers: Record<string, InlineSpecifiersProjectSnapshot>;
}
interface InlineSpecifiersProjectSnapshot {
    dependencies?: InlineSpecifiersResolvedDependencies;
    devDependencies?: InlineSpecifiersResolvedDependencies;
    optionalDependencies?: InlineSpecifiersResolvedDependencies;
    dependenciesMeta?: ProjectSnapshot['dependenciesMeta'];
}
interface InlineSpecifiersResolvedDependencies {
    [depName: string]: SpecifierAndResolution;
}
interface SpecifierAndResolution {
    specifier: string;
    version: string;
}
export {};
