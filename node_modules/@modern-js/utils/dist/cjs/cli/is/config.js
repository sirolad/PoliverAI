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
var config_exports = {};
__export(config_exports, {
  isSSGEntry: () => isSSGEntry,
  isSSR: () => isSSR,
  isServiceWorker: () => isServiceWorker,
  isSingleEntry: () => isSingleEntry,
  isUseRsc: () => isUseRsc,
  isUseSSRBundle: () => isUseSSRBundle
});
module.exports = __toCommonJS(config_exports);
var import_constants = require("../constants");
var import_type = require("./type");
const isSSR = (config) => {
  const { server } = config;
  if (server === null || server === void 0 ? void 0 : server.ssr) {
    return true;
  }
  if ((server === null || server === void 0 ? void 0 : server.ssrByEntries) && !(0, import_type.isEmpty)(server.ssrByEntries)) {
    for (const name of Object.keys(server.ssrByEntries)) {
      if (server.ssrByEntries[name]) {
        return true;
      }
    }
  }
  return false;
};
const isUseSSRBundle = (config) => {
  const { output } = config;
  if (output === null || output === void 0 ? void 0 : output.ssg) {
    return true;
  }
  return isSSR(config);
};
const isUseRsc = (config) => {
  var _config_server;
  return config === null || config === void 0 ? void 0 : (_config_server = config.server) === null || _config_server === void 0 ? void 0 : _config_server.rsc;
};
const isServiceWorker = (config) => {
  var _deploy_worker;
  const { output, deploy } = config;
  if ((deploy === null || deploy === void 0 ? void 0 : (_deploy_worker = deploy.worker) === null || _deploy_worker === void 0 ? void 0 : _deploy_worker.ssr) && ((output === null || output === void 0 ? void 0 : output.ssg) || isSSR(config))) {
    return true;
  }
  return false;
};
const isSSGEntry = (config, entryName, entrypoints) => {
  var _config_source;
  const ssgConfig = config.output.ssg;
  const useSSG = isSingleEntry(entrypoints, (_config_source = config.source) === null || _config_source === void 0 ? void 0 : _config_source.mainEntryName) ? Boolean(ssgConfig) : ssgConfig === true || typeof (ssgConfig === null || ssgConfig === void 0 ? void 0 : ssgConfig[0]) === "function" || Boolean(ssgConfig === null || ssgConfig === void 0 ? void 0 : ssgConfig[entryName]);
  return useSSG;
};
const isSingleEntry = (entrypoints, mainEntryName = import_constants.MAIN_ENTRY_NAME) => entrypoints.length === 1 && entrypoints[0].entryName === mainEntryName;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isSSGEntry,
  isSSR,
  isServiceWorker,
  isSingleEntry,
  isUseRsc,
  isUseSSRBundle
});
