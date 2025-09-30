/**
 * Require function compatible with esm and cjs module.
 * @param path - File to required.
 * @returns module export object.
 */
export declare function compatibleRequire(path: string, interop?: boolean): Promise<any>;
export declare function loadFromProject(moduleName: string, appDir: string): Promise<any>;
export declare const dynamicImport: Function;
export declare const requireExistModule: (filename: string, opt?: {
    extensions?: string[];
    interop?: boolean;
}) => Promise<any>;
export declare const cleanRequireCache: (filelist: string[]) => void;
export declare function deleteRequireCache(path: string): void;
/**
 * Try to resolve npm package entry file path.
 * @param name - Package name.
 * @param resolvePath - Path to resolve dependencies.
 * @returns Resolved file path.
 */
export declare const tryResolve: (name: string, resolvePath: string) => string;
