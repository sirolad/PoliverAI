export declare function getPnpmVersion(): Promise<string>;
export declare function canUseNpm(): Promise<boolean>;
export declare function canUseYarn(): Promise<boolean>;
export declare function canUsePnpm(): Promise<boolean>;
export declare function removeModuleSyncFromExports(exports: Record<string, any>): Record<string, any>;
