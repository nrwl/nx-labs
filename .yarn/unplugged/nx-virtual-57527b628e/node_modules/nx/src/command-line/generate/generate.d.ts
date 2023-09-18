import { FileChange } from '../../generators/tree';
import { Options, Schema } from '../../utils/params';
import type { Arguments } from 'yargs';
export interface GenerateOptions {
    collectionName: string;
    generatorName: string;
    generatorOptions: Options;
    help: boolean;
    dryRun: boolean;
    interactive: boolean;
    defaults: boolean;
    quiet: boolean;
}
export declare function printChanges(fileChanges: FileChange[]): void;
export declare function printGenHelp(opts: GenerateOptions, schema: Schema, normalizedGeneratorName: string, aliases: string[]): void;
export declare function generate(cwd: string, args: {
    [k: string]: any;
}): Promise<any>;
/**
 * Wraps `workspace-generator` to invoke `generate`.
 *
 * @deprecated(v17): Remove `workspace-generator in v17. Use local plugins.
 */
export declare function workspaceGenerators(args: Arguments): Promise<any>;
