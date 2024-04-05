import type { PluginCapabilities } from './models';
import { ProjectsConfigurations } from '../../config/workspace-json-project-json';
import { NxJsonConfiguration } from '../../config/nx-json';
export declare function getLocalWorkspacePlugins(projectsConfiguration: ProjectsConfigurations, nxJson: NxJsonConfiguration): Promise<Map<string, PluginCapabilities>>;
export declare function listLocalWorkspacePlugins(installedPlugins: Map<string, PluginCapabilities>): void;
