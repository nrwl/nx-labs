import { CommandModule } from 'yargs';
export declare const yargsAffectedCommand: CommandModule;
export declare const yargsAffectedTestCommand: CommandModule;
export declare const yargsAffectedBuildCommand: CommandModule;
export declare const yargsAffectedLintCommand: CommandModule;
export declare const yargsAffectedE2ECommand: CommandModule;
export declare const affectedGraphDeprecationMessage = "Use `nx graph --affected`, or `nx affected --graph` instead depending on which best suits your use case. The `affected:graph` command will be removed in Nx 19.";
/**
 * @deprecated 'Use `nx graph --affected`, or` nx affected --graph` instead depending on which best suits your use case. The `affected:graph` command will be removed in Nx 19.'
 */
export declare const yargsAffectedGraphCommand: CommandModule;
export declare const printAffectedDeprecationMessage = "Use `nx show projects --affected`, `nx affected --graph -t build` or `nx graph --affected` depending on which best suits your use case. The `print-affected` command will be removed in Nx 19.";
/**
 * @deprecated 'Use `nx show --affected`, `nx affected --graph` or `nx graph --affected` depending on which best suits your use case. The `print-affected` command will be removed in Nx 19.'
 */
export declare const yargsPrintAffectedCommand: CommandModule;
