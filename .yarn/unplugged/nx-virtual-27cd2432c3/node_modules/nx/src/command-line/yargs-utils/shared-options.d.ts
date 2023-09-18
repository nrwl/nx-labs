import { Argv } from 'yargs';
export declare function withExcludeOption(yargs: Argv): Argv<{
    exclude: string;
}>;
export declare function withRunOptions(yargs: Argv): Argv<{
    exclude: string;
} & {
    parallel: string;
} & {
    maxParallel: number;
} & {
    runner: string;
} & {
    prod: boolean;
} & {
    graph: string;
} & {
    verbose: boolean;
} & {
    "nx-bail": boolean;
} & {
    "nx-ignore-cycles": boolean;
} & {
    "skip-nx-cache": boolean;
} & {
    cloud: boolean;
} & {
    dte: boolean;
}>;
export declare function withTargetAndConfigurationOption(yargs: Argv, demandOption?: boolean): Argv<{
    configuration: string;
} & {
    targets: string;
}>;
export declare function withConfiguration(yargs: Argv): Argv<{
    configuration: string;
}>;
export declare function withAffectedOptions(yargs: Argv): Argv<{
    exclude: string;
} & {
    files: string;
} & {
    uncommitted: boolean;
} & {
    untracked: boolean;
} & {
    base: string;
} & {
    head: string;
}>;
export declare function withRunManyOptions(yargs: Argv): Argv<{
    exclude: string;
} & {
    parallel: string;
} & {
    maxParallel: number;
} & {
    runner: string;
} & {
    prod: boolean;
} & {
    graph: string;
} & {
    verbose: boolean;
} & {
    "nx-bail": boolean;
} & {
    "nx-ignore-cycles": boolean;
} & {
    "skip-nx-cache": boolean;
} & {
    cloud: boolean;
} & {
    dte: boolean;
} & {
    projects: string;
} & {
    all: boolean;
}>;
export declare function withOverrides(args: any): any;
export declare function withOutputStyleOption(yargs: Argv, choices?: string[]): Argv<{
    "output-style": string;
}>;
export declare function withDepGraphOptions(yargs: Argv): Argv<{
    file: string;
} & {
    view: string;
} & {
    targets: string;
} & {
    focus: string;
} & {
    exclude: string;
} & {
    groupByFolder: boolean;
} & {
    host: string;
} & {
    port: number;
} & {
    watch: boolean;
} & {
    open: boolean;
}>;
export declare function withRunOneOptions(yargs: Argv): Argv<{
    exclude: string;
} & {
    parallel: string;
} & {
    maxParallel: number;
} & {
    runner: string;
} & {
    prod: boolean;
} & {
    graph: string;
} & {
    verbose: boolean;
} & {
    "nx-bail": boolean;
} & {
    "nx-ignore-cycles": boolean;
} & {
    "skip-nx-cache": boolean;
} & {
    cloud: boolean;
} & {
    dte: boolean;
} & {
    project: string;
} & {
    help: boolean;
}>;
export declare function parseCSV(args: string[] | string): string | string[];
