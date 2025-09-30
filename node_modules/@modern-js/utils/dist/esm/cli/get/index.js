import { _ as _async_to_generator } from "@swc/helpers/_/_async_to_generator";
import { _ as _ts_generator } from "@swc/helpers/_/_ts_generator";
import path from "path";
import { CONFIG_FILE_EXTENSIONS } from "../constants";
import { findExists } from "../fs";
var getServerConfig = function() {
  var _ref = _async_to_generator(function(appDirectory, configFile) {
    var configFilePath;
    return _ts_generator(this, function(_state) {
      configFilePath = findExists(CONFIG_FILE_EXTENSIONS.map(function(extension) {
        return path.resolve(appDirectory, "".concat(configFile).concat(extension));
      }));
      return [
        2,
        configFilePath
      ];
    });
  });
  return function getServerConfig2(appDirectory, configFile) {
    return _ref.apply(this, arguments);
  };
}();
var getMeta = function() {
  var metaName = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "modern-js";
  var meta = metaName.toLowerCase().split("-")[0];
  return meta;
};
var getTargetDir = function(from, baseDir, targetBaseDir) {
  var relativePath = path.relative(baseDir, from);
  return path.resolve(targetBaseDir, relativePath);
};
export * from "./data";
export * from "./config";
export {
  getMeta,
  getServerConfig,
  getTargetDir
};
