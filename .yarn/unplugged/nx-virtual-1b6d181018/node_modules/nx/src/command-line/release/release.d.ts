import { ReleaseOptions, VersionOptions } from './command-object';
import { NxReleaseVersionResult } from './version';
export declare const releaseCLIHandler: (args: VersionOptions) => Promise<any>;
export declare function release(args: ReleaseOptions): Promise<NxReleaseVersionResult | number>;
