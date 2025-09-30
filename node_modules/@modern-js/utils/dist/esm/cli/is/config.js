import { MAIN_ENTRY_NAME } from "../constants";
import { isEmpty } from "./type";
var isSSR = function(config) {
  var server = config.server;
  if (server === null || server === void 0 ? void 0 : server.ssr) {
    return true;
  }
  if ((server === null || server === void 0 ? void 0 : server.ssrByEntries) && !isEmpty(server.ssrByEntries)) {
    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = void 0;
    try {
      for (var _iterator = Object.keys(server.ssrByEntries)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var name = _step.value;
        if (server.ssrByEntries[name]) {
          return true;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }
  return false;
};
var isUseSSRBundle = function(config) {
  var output = config.output;
  if (output === null || output === void 0 ? void 0 : output.ssg) {
    return true;
  }
  return isSSR(config);
};
var isUseRsc = function(config) {
  var _config_server;
  return config === null || config === void 0 ? void 0 : (_config_server = config.server) === null || _config_server === void 0 ? void 0 : _config_server.rsc;
};
var isServiceWorker = function(config) {
  var _deploy_worker;
  var output = config.output, deploy = config.deploy;
  if ((deploy === null || deploy === void 0 ? void 0 : (_deploy_worker = deploy.worker) === null || _deploy_worker === void 0 ? void 0 : _deploy_worker.ssr) && ((output === null || output === void 0 ? void 0 : output.ssg) || isSSR(config))) {
    return true;
  }
  return false;
};
var isSSGEntry = function(config, entryName, entrypoints) {
  var _config_source;
  var ssgConfig = config.output.ssg;
  var useSSG = isSingleEntry(entrypoints, (_config_source = config.source) === null || _config_source === void 0 ? void 0 : _config_source.mainEntryName) ? Boolean(ssgConfig) : ssgConfig === true || typeof (ssgConfig === null || ssgConfig === void 0 ? void 0 : ssgConfig[0]) === "function" || Boolean(ssgConfig === null || ssgConfig === void 0 ? void 0 : ssgConfig[entryName]);
  return useSSG;
};
var isSingleEntry = function(entrypoints) {
  var mainEntryName = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : MAIN_ENTRY_NAME;
  return entrypoints.length === 1 && entrypoints[0].entryName === mainEntryName;
};
export {
  isSSGEntry,
  isSSR,
  isServiceWorker,
  isSingleEntry,
  isUseRsc,
  isUseSSRBundle
};
