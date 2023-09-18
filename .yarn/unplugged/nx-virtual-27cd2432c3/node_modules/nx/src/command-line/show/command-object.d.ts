import { CommandModule } from 'yargs';
export interface NxShowArgs {
    json?: boolean;
}
export type ShowProjectsOptions = NxShowArgs & {
    exclude: string;
    files: string;
    uncommitted: any;
    untracked: any;
    base: string;
    head: string;
    affected: boolean;
    projects: string[];
    withTarget: string;
};
export type ShowProjectOptions = NxShowArgs & {
    projectName: string;
};
export declare const yargsShowCommand: CommandModule<Record<string, unknown>, NxShowArgs>;
