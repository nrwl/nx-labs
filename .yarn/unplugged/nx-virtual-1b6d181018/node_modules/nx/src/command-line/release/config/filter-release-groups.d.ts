import { ProjectGraph } from '../../../config/project-graph';
import { NxReleaseConfig } from './config';
export type ReleaseGroupWithName = NxReleaseConfig['groups'][string] & {
    name: string;
};
export declare function filterReleaseGroups(projectGraph: ProjectGraph, nxReleaseConfig: NxReleaseConfig, projectsFilter?: string[], groupsFilter?: string[]): {
    error: null | {
        title: string;
        bodyLines?: string[];
    };
    releaseGroups: ReleaseGroupWithName[];
    releaseGroupToFilteredProjects: Map<ReleaseGroupWithName, Set<string>>;
};
