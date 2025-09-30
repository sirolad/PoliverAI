export type Alias = Record<string, string | string[]>;
export type AliasOption = Alias | ((aliases: Alias) => Alias | void);
interface NormalizedConfig {
    source: {
        alias?: AliasOption | Array<AliasOption>;
    };
}
interface IAliasConfig {
    absoluteBaseUrl: string;
    paths?: Record<string, string | string[]>;
    isTsPath?: boolean;
    isTsProject?: boolean;
}
export declare const mergeAlias: (alias: NormalizedConfig["source"]["alias"]) => Alias;
export declare const getAliasConfig: (aliasOption: NormalizedConfig["source"]["alias"], option: {
    appDirectory: string;
    tsconfigPath: string;
}) => IAliasConfig;
export declare const getUserAlias: (alias?: Record<string, string | string[]>) => Record<string, string | string[]>;
export {};
