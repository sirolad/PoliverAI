export declare const getServerConfig: (appDirectory: string, configFile: string) => Promise<string | false>;
/**
 * Transform the metaName
 * @param metaName The name of framework, the default value is 'modern-js'
 * @returns
 * modern-js -> modern
 */
export declare const getMeta: (metaName?: string) => string;
export declare const getTargetDir: (from: string, baseDir: string, targetBaseDir: string) => string;
export * from './data';
export * from './config';
