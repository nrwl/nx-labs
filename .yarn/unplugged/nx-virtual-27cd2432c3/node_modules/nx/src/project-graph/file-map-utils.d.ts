import { FileData, ProjectFileMap, ProjectGraph } from '../config/project-graph';
import { ProjectConfiguration, ProjectsConfigurations } from '../config/workspace-json-project-json';
export declare function createProjectFileMapUsingProjectGraph(graph: ProjectGraph): Promise<ProjectFileMap>;
export declare function createProjectFileMap(projectsConfigurations: ProjectsConfigurations, allWorkspaceFiles: FileData[]): {
    projectFileMap: ProjectFileMap;
    allWorkspaceFiles: FileData[];
};
export declare function updateProjectFileMap(projectsConfigurations: Record<string, ProjectConfiguration>, projectFileMap: ProjectFileMap, allWorkspaceFiles: FileData[], updatedFiles: Map<string, string>, deletedFiles: string[]): {
    projectFileMap: ProjectFileMap;
    allWorkspaceFiles: FileData[];
};
