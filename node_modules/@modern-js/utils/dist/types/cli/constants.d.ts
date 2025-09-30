import type { InternalPlugins } from '@modern-js/types';
export { NESTED_ROUTE_SPEC_FILE, MAIN_ENTRY_NAME, ROUTE_SPEC_FILE, SERVER_BUNDLE_DIRECTORY, SERVER_RENDER_FUNCTION_NAME, SERVER_PLUGIN_BFF, SERVER_PLUGIN_EXPRESS, SERVER_PLUGIN_KOA, SERVER_PLUGIN_SERVER, SERVER_PLUGIN_POLYFILL, } from '../universal/constants';
export declare const JS_EXTENSIONS: string[];
/**
 * server side bundles directory, which relative to dist.
 */
export declare const SERVER_WORKER_BUNDLE_DIRECTORY = "worker";
/**
 * entry name pattern used for ajv pattern properties.
 */
export declare const ENTRY_NAME_PATTERN = "^[a-zA-Z0-9_-]+$";
/**
 * loadbale manifest json file
 */
export declare const LOADABLE_STATS_FILE = "loadable-stats.json";
/**
 * internal specified folder
 */
export declare const API_DIR = "api";
export declare const SERVER_DIR = "server";
export declare const SHARED_DIR = "shared";
/**
 * Modern.config.ts cached dir
 */
export declare const CONFIG_CACHE_DIR = "./node_modules/.cache/bundle-require";
export declare const CONFIG_FILE_EXTENSIONS: string[];
/**
 * Serialized config path
 */
export declare const OUTPUT_CONFIG_FILE = "modern.config.json";
/**
 * Default runtime config filename
 */
export declare const DEFAULT_RUNTIME_CONFIG = "modern.runtime";
/**
 * Default server config basename
 */
export declare const DEFAULT_SERVER_CONFIG = "modern.server-runtime.config";
/**
 * Routes manifest filename
 */
export declare const ROUTE_MANIFEST_FILE = "routes-manifest.json";
/**
 * directory name for loader routes
 */
export declare const LOADER_ROUTES_DIR = "loader-routes";
/**
 * default host for dev
 */
export declare const DEFAULT_DEV_HOST = "0.0.0.0";
/**
 * Internal app-tools plugins that work as soon as they are installed.
 */
export declare const INTERNAL_APP_TOOLS_PLUGINS: InternalPlugins;
export declare const INTERNAL_APP_TOOLS_RUNTIME_PLUGINS: InternalPlugins;
/**
 * Internal module-tools plugins that work as soon as they are installed.
 */
export declare const INTERNAL_MODULE_TOOLS_PLUGINS: InternalPlugins;
/**
 * Internal monorepo-tools plugins that work as soon as they are installed.
 */
export declare const INTERNAL_MONOREPO_TOOLS_PLUGINS: InternalPlugins;
/**
 * Internal doc-tools plugins that work as soon as they are installed.
 */
export declare const INTERNAL_DOC_TOOLS_PLUGINS: InternalPlugins;
/**
 * Internal plugins that work as soon as they are installed.
 */
export declare const INTERNAL_CLI_PLUGINS: InternalPlugins;
