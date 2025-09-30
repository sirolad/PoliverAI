import { type BuildOptions, type Plugin } from 'esbuild';
export declare const EXTERNAL_REGEXP: RegExp;
export interface Options {
    /**
     * The `require` function that is used to load the output file
     * Default to the global `require` function
     * This function can be asynchronous, i.e. returns a Promise
     */
    require?: (outfile: string) => any;
    /**
     * esbuild options
     */
    esbuildOptions?: BuildOptions;
    /**
     * esbuild plugin
     */
    esbuildPlugins?: Plugin[];
    /**
     * Get the path to the output file
     * By default we simply replace the extension with `.bundled.cjs`
     */
    getOutputFile?: (filepath: string) => Promise<string>;
    /**
     * auto clear bundle file
     */
    autoClear?: boolean;
    /**
     * Whether to enable watch mode
     */
    watch?: boolean;
}
export declare const defaultGetOutputFile: (filepath: string) => Promise<string>;
export declare function bundle(filepath: string, options?: Options): Promise<string>;
