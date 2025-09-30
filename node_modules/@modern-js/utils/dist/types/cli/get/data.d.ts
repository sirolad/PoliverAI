import type { InternalPlugins } from '@modern-js/types';
export declare function getPackageManager(cwd?: string): Promise<"pnpm" | "npm" | "yarn">;
export declare const getCoreJsVersion: (corejsPkgPath: string) => string;
export declare const getAntdMajorVersion: (appDirectory: string) => number | null;
export declare const defaults: string[];
export declare const getBrowserslist: (appDirectory: string) => string[];
export declare function getInternalPlugins(appDirectory: string, internalPlugins?: InternalPlugins): string[];
export declare const readTsConfig: (root: string) => any;
export declare const readTsConfigByFile: (filename: string) => any;
