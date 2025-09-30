import { _ as _async_to_generator } from "@swc/helpers/_/_async_to_generator";
import { _ as _sliced_to_array } from "@swc/helpers/_/_sliced_to_array";
import { _ as _to_consumable_array } from "@swc/helpers/_/_to_consumable_array";
import { _ as _ts_generator } from "@swc/helpers/_/_ts_generator";
import os from "os";
import path from "path";
import { fs, browserslist, json5 } from "../../compiled";
import { INTERNAL_CLI_PLUGINS } from "../constants";
import { isDepExists } from "../is";
import { canUsePnpm, canUseYarn } from "../package";
var MAX_TIMES = 5;
function getPackageManager() {
  return _getPackageManager.apply(this, arguments);
}
function _getPackageManager() {
  _getPackageManager = _async_to_generator(function() {
    var cwd, appDirectory, times;
    var _arguments = arguments;
    return _ts_generator(this, function(_state) {
      switch (_state.label) {
        case 0:
          cwd = _arguments.length > 0 && _arguments[0] !== void 0 ? _arguments[0] : process.cwd();
          appDirectory = cwd;
          times = 0;
          while (os.homedir() !== appDirectory && times < MAX_TIMES) {
            times++;
            if (fs.existsSync(path.resolve(appDirectory, "pnpm-lock.yaml"))) {
              return [
                2,
                "pnpm"
              ];
            }
            if (fs.existsSync(path.resolve(appDirectory, "yarn.lock"))) {
              return [
                2,
                "yarn"
              ];
            }
            if (fs.existsSync(path.resolve(appDirectory, "package-lock.json"))) {
              return [
                2,
                "npm"
              ];
            }
            appDirectory = path.join(appDirectory, "..");
          }
          return [
            4,
            canUsePnpm()
          ];
        case 1:
          if (_state.sent()) {
            return [
              2,
              "pnpm"
            ];
          }
          return [
            4,
            canUseYarn()
          ];
        case 2:
          if (_state.sent()) {
            return [
              2,
              "yarn"
            ];
          }
          return [
            2,
            "npm"
          ];
      }
    });
  });
  return _getPackageManager.apply(this, arguments);
}
var getCoreJsVersion = function(corejsPkgPath) {
  try {
    var version = fs.readJSONSync(corejsPkgPath).version;
    var _version_split = _sliced_to_array(version.split("."), 2), major = _version_split[0], minor = _version_split[1];
    return "".concat(major, ".").concat(minor);
  } catch (err) {
    return "3";
  }
};
var getAntdMajorVersion = function(appDirectory) {
  try {
    var pkgJsonPath = require.resolve("antd/package.json", {
      paths: [
        appDirectory
      ]
    });
    var version = require(pkgJsonPath).version;
    return Number(version.split(".")[0]);
  } catch (err) {
    return null;
  }
};
var defaults = [
  "> 0.01%",
  "not dead",
  "not op_mini all"
];
var getBrowserslist = function(appDirectory) {
  return browserslist.loadConfig({
    path: appDirectory
  }) || defaults;
};
function getInternalPlugins(appDirectory) {
  var internalPlugins = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : INTERNAL_CLI_PLUGINS;
  return _to_consumable_array(Object.keys(internalPlugins).filter(function(name) {
    var config = internalPlugins[name];
    if (typeof config !== "string" && config.forced === true) {
      return true;
    }
    return isDepExists(appDirectory, name);
  }).map(function(name) {
    var config = internalPlugins[name];
    if (typeof config !== "string") {
      return config.path;
    } else {
      return config;
    }
  }));
}
var readTsConfig = function(root) {
  return readTsConfigByFile(path.resolve(root, "./tsconfig.json"));
};
var readTsConfigByFile = function(filename) {
  var content = fs.readFileSync(path.resolve(filename), "utf-8");
  return json5.parse(content);
};
export {
  defaults,
  getAntdMajorVersion,
  getBrowserslist,
  getCoreJsVersion,
  getInternalPlugins,
  getPackageManager,
  readTsConfig,
  readTsConfigByFile
};
