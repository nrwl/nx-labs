import * as yargs from 'yargs';
import type { NxArgs } from '../../utils/command-line-utils';
import { ProjectGraph, ProjectGraphProjectNode } from '../../config/project-graph';
import { NxJsonConfiguration } from '../../config/nx-json';
/**
 * @deprecated Use showProjectsHandler, generateGraph, or affected (without the print-affected mode) instead.
 */
export declare function printAffected(affectedProjects: ProjectGraphProjectNode[], projectGraph: ProjectGraph, { nxJson }: {
    nxJson: NxJsonConfiguration;
}, nxArgs: NxArgs, overrides: yargs.Arguments): Promise<void>;
export declare function selectPrintAffected(wholeJson: any, wholeSelect: string): any;
