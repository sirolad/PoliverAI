"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var constants_exports = {};
__export(constants_exports, {
  HMR_SOCK_PATH: () => HMR_SOCK_PATH,
  HTML_CHUNKSMAP_SEPARATOR: () => HTML_CHUNKSMAP_SEPARATOR,
  LOADER_REPORTER_NAME: () => LOADER_REPORTER_NAME,
  MAIN_ENTRY_NAME: () => MAIN_ENTRY_NAME,
  NESTED_ROUTE_SPEC_FILE: () => NESTED_ROUTE_SPEC_FILE,
  ROUTE_MANIFEST: () => ROUTE_MANIFEST,
  ROUTE_MODULES: () => ROUTE_MODULES,
  ROUTE_SPEC_FILE: () => ROUTE_SPEC_FILE,
  SERVER_BUNDLE_DIRECTORY: () => SERVER_BUNDLE_DIRECTORY,
  SERVER_PLUGIN_BFF: () => SERVER_PLUGIN_BFF,
  SERVER_PLUGIN_EXPRESS: () => SERVER_PLUGIN_EXPRESS,
  SERVER_PLUGIN_KOA: () => SERVER_PLUGIN_KOA,
  SERVER_PLUGIN_POLYFILL: () => SERVER_PLUGIN_POLYFILL,
  SERVER_PLUGIN_SERVER: () => SERVER_PLUGIN_SERVER,
  SERVER_RENDER_FUNCTION_NAME: () => SERVER_RENDER_FUNCTION_NAME
});
module.exports = __toCommonJS(constants_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
