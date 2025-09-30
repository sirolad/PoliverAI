/**
 * Check if the package name is in dependencies or devDependencies.
 *
 * @param appDirectory - Project root directory.
 * @param name - Package name.
 * @returns True if the name is in dependencies or devDependencies, false otherwise.
 */
export declare const isDepExists: (appDirectory: string, name: string) => boolean;
/**
 * Try to resolve npm package, return true if package is installed.
 */
export declare const isPackageInstalled: (name: string, resolvePaths: string | string[]) => boolean;
/**
 * Check is api only project
 * 1. env --api-only
 * 2. exist ${apiDir}/ && not exist ${entryDir}/
 *
 * @param appDirectory
 * @param entryDir default 'src'
 * @param apiDir default 'api'
 * @returns boolean
 */
export declare const isApiOnly: (appDirectory: string, entryDir?: string, apiDir?: string) => Promise<boolean>;
export declare const isWebOnly: () => Promise<boolean>;
export declare const isVersionBeyond17: (version: string) => boolean;
export declare const getReactVersion: (cwd: string) => string | false;
/**
 * @deprecated Use {@link isSupportAutomaticJsx} to check if the project supports automatic JSX instead.
 */
export declare const isBeyondReact17: (cwd: string) => boolean;
export declare const isSupportAutomaticJsx: (cwd: string) => boolean;
export declare const isReact18: (cwd?: string) => boolean;
/**
 * Is typescript project.
 *
 * @param root - App directory.
 * @returns Whether to use typescript.
 */
export declare const isTypescript: (root: string) => boolean;
