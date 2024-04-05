import { ProjectGraphProjectNode } from '../../config/project-graph';
import { ProjectGraphBuilder } from '../project-graph-builder';
import { ProjectConfiguration, TargetConfiguration } from '../../config/workspace-json-project-json';
import { CreateDependenciesContext } from '../../utils/nx-plugin';
export declare function normalizeProjectNodes(ctx: CreateDependenciesContext, builder: ProjectGraphBuilder): Promise<void>;
/**
 * Apply target defaults and normalization
 */
export declare function normalizeProjectTargets(project: ProjectConfiguration, projectName: string): Record<string, TargetConfiguration>;
export declare function normalizeImplicitDependencies(source: string, implicitDependencies: ProjectConfiguration['implicitDependencies'], projects: Record<string, ProjectGraphProjectNode>): string[];
