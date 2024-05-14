import { ProjectConfiguration } from '../../../config/workspace-json-project-json';
import { NxPluginV2 } from '../../../utils/nx-plugin';
export declare const ProjectJsonProjectsPlugin: NxPluginV2;
export declare function buildProjectFromProjectJson(json: Partial<ProjectConfiguration>, path: string): ProjectConfiguration;
