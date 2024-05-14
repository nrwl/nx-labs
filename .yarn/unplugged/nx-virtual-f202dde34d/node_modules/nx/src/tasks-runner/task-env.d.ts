/// <reference types="node" />
import { Task } from '../config/task-graph';
export declare function getEnvVariablesForBatchProcess(skipNxCache: boolean, captureStderr: boolean): NodeJS.ProcessEnv;
export declare function getTaskSpecificEnv(task: Task): NodeJS.ProcessEnv;
export declare function getEnvVariablesForTask(task: Task, taskSpecificEnv: NodeJS.ProcessEnv, forceColor: string, skipNxCache: boolean, captureStderr: boolean, outputPath: string, streamOutput: boolean): {
    [x: string]: string;
    TZ?: string;
};
