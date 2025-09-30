const ROUTE_MANIFEST = `_MODERNJS_ROUTE_MANIFEST`;
const ROUTE_MODULES = `_routeModules`;
const HMR_SOCK_PATH = "/webpack-hmr";
const HTML_CHUNKSMAP_SEPARATOR = "<!--<?- chunksMap.js ?>-->";
const LOADER_REPORTER_NAME = `server-loader`;
const ROUTE_SPEC_FILE = "route.json";
const NESTED_ROUTE_SPEC_FILE = "nestedRoutes.json";
const MAIN_ENTRY_NAME = "main";
const SERVER_BUNDLE_DIRECTORY = "bundles";
const SERVER_RENDER_FUNCTION_NAME = "serverRender";
const SERVER_PLUGIN_BFF = "@modern-js/plugin-bff";
const SERVER_PLUGIN_EXPRESS = "@modern-js/plugin-express";
const SERVER_PLUGIN_KOA = "@modern-js/plugin-koa";
const SERVER_PLUGIN_SERVER = "@modern-js/plugin-server";
const SERVER_PLUGIN_POLYFILL = "@modern-js/plugin-polyfill";
export {
  HMR_SOCK_PATH,
  HTML_CHUNKSMAP_SEPARATOR,
  LOADER_REPORTER_NAME,
  MAIN_ENTRY_NAME,
  NESTED_ROUTE_SPEC_FILE,
  ROUTE_MANIFEST,
  ROUTE_MODULES,
  ROUTE_SPEC_FILE,
  SERVER_BUNDLE_DIRECTORY,
  SERVER_PLUGIN_BFF,
  SERVER_PLUGIN_EXPRESS,
  SERVER_PLUGIN_KOA,
  SERVER_PLUGIN_POLYFILL,
  SERVER_PLUGIN_SERVER,
  SERVER_RENDER_FUNCTION_NAME
};
