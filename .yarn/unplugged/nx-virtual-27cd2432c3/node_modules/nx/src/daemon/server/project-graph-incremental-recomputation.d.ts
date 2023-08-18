import { FileData, ProjectFileMap, ProjectGraph } from '../../config/project-graph';
import { ProjectFileMapCache } from '../../project-graph/nx-deps-cache';
export declare let projectFileMapWithFiles: {
    projectFileMap: ProjectFileMap;
    allWorkspaceFiles: FileData[];
} | undefined;
export declare let currentProjectFileMapCache: ProjectFileMapCache | undefined;
export declare let currentProjectGraph: ProjectGraph | undefined;
export declare function getCachedSerializedProjectGraphPromise(): Promise<{
    error: Error;
    projectGraph: ProjectGraph;
    projectFileMap: ProjectFileMap;
    allWorkspaceFiles: FileData[];
    serializedProjectGraph: string;
} | {
    error: any;
    serializedProjectGraph: any;
    projectGraph: any;
    projectFileMap: any;
    allWorkspaceFiles: any;
}>;
export declare function addUpdatedAndDeletedFiles(createdFiles: string[], updatedFiles: string[], deletedFiles: string[]): void;
