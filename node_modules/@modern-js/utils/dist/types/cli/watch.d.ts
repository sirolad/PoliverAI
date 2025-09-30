export type WatchChangeTypeValueT = 'add' | 'unlink' | 'change';
export declare const WatchChangeType: Record<'ADD' | 'UNLINK' | 'CHANGE', WatchChangeTypeValueT>;
type RunTaskType = (option: {
    changedFilePath: string;
    changeType: WatchChangeTypeValueT;
}) => void | Promise<void>;
export declare const watch: (watchDir: string | string[], runTask: RunTaskType, ignored?: (string | RegExp)[]) => import("compiled/chokidar/types").FSWatcher;
export {};
