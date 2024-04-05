import { NxJsonConfiguration } from '../../config/nx-json';
import { ProjectConfiguration } from '../../config/workspace-json-project-json';
import { NxPluginV2 } from '../../utils/nx-plugin';
import { PackageJson } from '../../utils/package-json';
export declare function getNxPackageJsonWorkspacesPlugin(root: string): NxPluginV2;
export declare function createNodeFromPackageJson(pkgJsonPath: string, root: string): {
    projects: {
        [x: string]: ProjectConfiguration & {
            name: string;
        };
    };
};
export declare function buildProjectConfigurationFromPackageJson(packageJson: PackageJson, path: string, nxJson: NxJsonConfiguration): ProjectConfiguration & {
    name: string;
};
/**
 * Get the package.json globs from package manager workspaces
 */
export declare function getGlobPatternsFromPackageManagerWorkspaces(root: string, readJson?: <T extends Object>(path: string) => T): string[];
