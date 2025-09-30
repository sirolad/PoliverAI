import type { Options } from './bundle';
import { bundle, defaultGetOutputFile } from './bundle';
export { bundle, defaultGetOutputFile };
export type { Options };
export declare function bundleRequire(filepath: string, options?: Options): Promise<any>;
