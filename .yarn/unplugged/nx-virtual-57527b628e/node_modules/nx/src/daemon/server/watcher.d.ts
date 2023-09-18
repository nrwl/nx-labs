/// <reference types="node" />
import type { AsyncSubscription, Event } from '@parcel/watcher';
import { Server } from 'net';
import type { WatchEvent } from '../../native';
export type FileWatcherCallback = (err: Error | string | null, changeEvents: Event[] | WatchEvent[] | null) => Promise<void>;
export declare function subscribeToOutputsChanges(cb: FileWatcherCallback): Promise<AsyncSubscription>;
export declare function watchWorkspace(server: Server, cb: FileWatcherCallback): Promise<import("../../native").Watcher>;
export declare function watchOutputFiles(cb: FileWatcherCallback): Promise<import("../../native").Watcher>;
export declare function subscribeToWorkspaceChanges(server: Server, cb: FileWatcherCallback): Promise<AsyncSubscription>;
export declare function subscribeToServerProcessJsonChanges(cb: () => void): Promise<AsyncSubscription>;
/**
 * NOTE: An event type of "create" will also apply to the case where the user has restored
 * an original version of a file after modifying/deleting it by using git, so we adjust
 * our log language accordingly.
 */
export declare function convertChangeEventsToLogMessage(changeEvents: Event[]): string;
