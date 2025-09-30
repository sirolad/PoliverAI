import { NESTED_ROUTE_SPEC_FILE, MAIN_ENTRY_NAME, ROUTE_SPEC_FILE, SERVER_BUNDLE_DIRECTORY, SERVER_RENDER_FUNCTION_NAME, SERVER_PLUGIN_BFF, SERVER_PLUGIN_EXPRESS, SERVER_PLUGIN_KOA, SERVER_PLUGIN_SERVER, SERVER_PLUGIN_POLYFILL } from "../universal/constants";
const JS_EXTENSIONS = [
  ".js",
  ".ts",
  ".jsx",
  ".tsx"
];
const SERVER_WORKER_BUNDLE_DIRECTORY = "worker";
const ENTRY_NAME_PATTERN = "^[a-zA-Z0-9_-]+$";
const LOADABLE_STATS_FILE = "loadable-stats.json";
const API_DIR = "api";
const SERVER_DIR = "server";
const SHARED_DIR = "shared";
const CONFIG_CACHE_DIR = "./node_modules/.cache/bundle-require";
const CONFIG_FILE_EXTENSIONS = [
  ".js",
  ".ts",
  ".mjs"
];
const OUTPUT_CONFIG_FILE = "modern.config.json";
const DEFAULT_RUNTIME_CONFIG = "modern.runtime";
const DEFAULT_SERVER_CONFIG = "modern.server-runtime.config";
const ROUTE_MANIFEST_FILE = "routes-manifest.json";
const LOADER_ROUTES_DIR = `loader-routes`;
const DEFAULT_DEV_HOST = "0.0.0.0";
const INTERNAL_APP_TOOLS_PLUGINS = {
  "@modern-js/app-tools": "@modern-js/app-tools/cli",
  "@modern-js/plugin-proxy": "@modern-js/plugin-proxy/cli",
  "@modern-js/plugin-ssg": "@modern-js/plugin-ssg/cli",
  "@modern-js/plugin-bff": "@modern-js/plugin-bff/cli",
  "@modern-js/plugin-storybook": "@modern-js/plugin-storybook/cli",
  "@modern-js/plugin-express": "@modern-js/plugin-express/cli",
  "@modern-js/plugin-koa": "@modern-js/plugin-koa/cli",
  "@modern-js/plugin-server": "@modern-js/plugin-server/cli",
  "@modern-js/plugin-garfish": "@modern-js/plugin-garfish/cli",
  "@modern-js/plugin-tailwindcss": "@modern-js/plugin-tailwindcss/cli",
  "@modern-js/plugin-polyfill": "@modern-js/plugin-polyfill/cli",
  // legacy router (inner react-router-dom v5)
  "@modern-js/plugin-router-v5": "@modern-js/plugin-router-v5/cli"
};
const INTERNAL_APP_TOOLS_RUNTIME_PLUGINS = {
  "@modern-js/runtime": "@modern-js/runtime/cli"
};
const INTERNAL_MODULE_TOOLS_PLUGINS = {
  "@modern-js/module-tools": "@modern-js/module-tools",
  "@modern-js/runtime": "@modern-js/runtime/cli",
  "@modern-js/plugin-storybook": "@modern-js/plugin-storybook/cli",
  "@modern-js/plugin-tailwindcss": "@modern-js/plugin-tailwindcss/cli",
  // legacy router (inner react-router-dom v5)
  "@modern-js/plugin-router-legacy": "@modern-js/plugin-router-legacy/cli"
};
const INTERNAL_MONOREPO_TOOLS_PLUGINS = {
  "@modern-js/monorepo-tools": "@modern-js/monorepo-tools/cli"
};
const INTERNAL_DOC_TOOLS_PLUGINS = {
  "@modern-js/doc-tools": "@modern-js/doc-tools",
  "@modern-js/runtime": "@modern-js/runtime/cli"
};
const INTERNAL_CLI_PLUGINS = {
  "@modern-js/app-tools": "@modern-js/app-tools/cli",
  "@modern-js/monorepo-tools": "@modern-js/monorepo-tools/cli",
  "@modern-js/module-tools": "@modern-js/module-tools",
  "@modern-js/doc-tools": "@modern-js/doc-tools",
  "@modern-js/runtime": "@modern-js/runtime/cli",
  "@modern-js/plugin-state": "@modern-js/plugin-state/cli",
  "@modern-js/plugin-proxy": "@modern-js/plugin-proxy/cli",
  "@modern-js/plugin-ssg": "@modern-js/plugin-ssg/cli",
  "@modern-js/plugin-bff": "@modern-js/plugin-bff/cli",
  "@modern-js/plugin-storybook": "@modern-js/plugin-storybook/cli",
  "@modern-js/plugin-express": "@modern-js/plugin-express/cli",
  "@modern-js/plugin-koa": "@modern-js/plugin-koa/cli",
  "@modern-js/plugin-server": "@modern-js/plugin-server/cli",
  "@modern-js/plugin-swc": "@modern-js/plugin-swc",
  "@modern-js/plugin-garfish": "@modern-js/plugin-garfish/cli",
  "@modern-js/plugin-tailwindcss": "@modern-js/plugin-tailwindcss/cli",
  "@modern-js/plugin-polyfill": "@modern-js/plugin-polyfill/cli",
  // legacy router (inner react-router-dom v5)
  "@modern-js/plugin-router-v5": "@modern-js/plugin-router-v5/cli"
};
export {
  API_DIR,
  CONFIG_CACHE_DIR,
  CONFIG_FILE_EXTENSIONS,
  DEFAULT_DEV_HOST,
  DEFAULT_RUNTIME_CONFIG,
  DEFAULT_SERVER_CONFIG,
  ENTRY_NAME_PATTERN,
  INTERNAL_APP_TOOLS_PLUGINS,
  INTERNAL_APP_TOOLS_RUNTIME_PLUGINS,
  INTERNAL_CLI_PLUGINS,
  INTERNAL_DOC_TOOLS_PLUGINS,
  INTERNAL_MODULE_TOOLS_PLUGINS,
  INTERNAL_MONOREPO_TOOLS_PLUGINS,
  JS_EXTENSIONS,
  LOADABLE_STATS_FILE,
  LOADER_ROUTES_DIR,
  MAIN_ENTRY_NAME,
  NESTED_ROUTE_SPEC_FILE,
  OUTPUT_CONFIG_FILE,
  ROUTE_MANIFEST_FILE,
  ROUTE_SPEC_FILE,
  SERVER_BUNDLE_DIRECTORY,
  SERVER_DIR,
  SERVER_PLUGIN_BFF,
  SERVER_PLUGIN_EXPRESS,
  SERVER_PLUGIN_KOA,
  SERVER_PLUGIN_POLYFILL,
  SERVER_PLUGIN_SERVER,
  SERVER_RENDER_FUNCTION_NAME,
  SERVER_WORKER_BUNDLE_DIRECTORY,
  SHARED_DIR
};
