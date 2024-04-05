import { CommandModule } from 'yargs';
export interface AddOptions {
    packageSpecifier: string;
    updatePackageScripts?: boolean;
    verbose?: boolean;
}
export declare const yargsAddCommand: CommandModule<Record<string, unknown>, AddOptions>;
