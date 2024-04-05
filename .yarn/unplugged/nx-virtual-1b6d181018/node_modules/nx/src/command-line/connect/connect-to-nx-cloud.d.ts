import { NxJsonConfiguration } from '../../config/nx-json';
import { NxArgs } from '../../utils/command-line-utils';
import { MessageKey } from '../../utils/ab-testing';
export declare function onlyDefaultRunnerIsUsed(nxJson: NxJsonConfiguration): boolean;
export declare function connectToNxCloudIfExplicitlyAsked(opts: NxArgs): Promise<void>;
export declare function connectToNxCloudCommand(): Promise<boolean>;
export declare function connectToNxCloudWithPrompt(command: string): Promise<void>;
export declare function connectExistingRepoToNxCloudPrompt(key?: MessageKey): Promise<boolean>;
