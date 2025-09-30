interface EntryPoint {
    entryName: string;
}
/**
 * Is SSR project
 *
 * @param config - User config.
 * @returns Whether to use server side render.
 */
export declare const isSSR: (config: any) => boolean;
export declare const isUseSSRBundle: (config: any) => boolean;
export declare const isUseRsc: (config: any) => boolean;
/**
 * Is Worker project
 *
 * @param config - User config.
 * @returns Whether to use worker deploy.
 */
export declare const isServiceWorker: (config: any) => boolean;
export declare const isSSGEntry: (config: any, entryName: string, entrypoints: EntryPoint[]) => boolean;
export declare const isSingleEntry: (entrypoints: EntryPoint[], mainEntryName?: string) => boolean;
export {};
