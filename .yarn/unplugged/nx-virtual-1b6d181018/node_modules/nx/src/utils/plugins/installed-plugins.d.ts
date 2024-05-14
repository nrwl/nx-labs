import type { PluginCapabilities } from './models';
import { PackageJson } from '../package-json';
import { ProjectConfiguration } from '../../config/workspace-json-project-json';
export declare function findInstalledPlugins(): PackageJson[];
export declare function getInstalledPluginsAndCapabilities(workspaceRoot: string, projects: Record<string, ProjectConfiguration>): Promise<Map<string, PluginCapabilities>>;
export declare function listInstalledPlugins(installedPlugins: Map<string, PluginCapabilities>): void;
