import { MAIN_ENTRY_NAME } from "../constants";
import { isEmpty } from "./type";
const isSSR = (config) => {
  const { server } = config;
  if (server === null || server === void 0 ? void 0 : server.ssr) {
    return true;
  }
  if ((server === null || server === void 0 ? void 0 : server.ssrByEntries) && !isEmpty(server.ssrByEntries)) {
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
const isSingleEntry = (entrypoints, mainEntryName = MAIN_ENTRY_NAME) => entrypoints.length === 1 && entrypoints[0].entryName === mainEntryName;
export {
  isSSGEntry,
  isSSR,
  isServiceWorker,
  isSingleEntry,
  isUseRsc,
  isUseSSRBundle
};
