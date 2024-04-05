import type { PluginCapabilities } from './models';
import { ProjectConfiguration } from '../../config/workspace-json-project-json';
export declare function getPluginCapabilities(workspaceRoot: string, pluginName: string, projects: Record<string, ProjectConfiguration>, includeRuntimeCapabilities?: boolean): Promise<PluginCapabilities | null>;
export declare function listPluginCapabilities(pluginName: string, projects: Record<string, ProjectConfiguration>): Promise<void>;
