import { _ as _async_to_generator } from "@swc/helpers/_/_async_to_generator";
import { _ as _object_spread } from "@swc/helpers/_/_object_spread";
import { _ as _ts_generator } from "@swc/helpers/_/_ts_generator";
import path from "path";
import pkgUp from "../../../compiled/pkg-up";
import { fs, minimist, semver } from "../../compiled";
import { getArgv } from "../commands";
import { createDebugger } from "../common";
import { ensureArray } from "../ensure";
var debug = createDebugger("judge-depExists");
var isDepExists = function(appDirectory, name) {
  var pkgPath = path.resolve(appDirectory, "./package.json");
  if (!fs.existsSync(pkgPath)) {
    debug("can't find package.json under: %s", appDirectory);
    return false;
  }
  var json = require(pkgPath);
  var _json_dependencies = json.dependencies, dependencies = _json_dependencies === void 0 ? {} : _json_dependencies, _json_devDependencies = json.devDependencies, devDependencies = _json_devDependencies === void 0 ? {} : _json_devDependencies;
  return dependencies.hasOwnProperty(name) || devDependencies.hasOwnProperty(name);
};
var isPackageInstalled = function(name, resolvePaths) {
  try {
    require.resolve(name, {
      paths: ensureArray(resolvePaths)
    });
    return true;
  } catch (err) {
    return false;
  }
};
var isApiOnly = function() {
  var _ref = _async_to_generator(function(appDirectory, entryDir, apiDir) {
    var existApi, existSrc, options;
    return _ts_generator(this, function(_state) {
      switch (_state.label) {
        case 0:
          return [
            4,
            fs.pathExists(apiDir !== null && apiDir !== void 0 ? apiDir : path.join(appDirectory, "api"))
          ];
        case 1:
          existApi = _state.sent();
          return [
            4,
            fs.pathExists(path.join(appDirectory, entryDir !== null && entryDir !== void 0 ? entryDir : "src"))
          ];
        case 2:
          existSrc = _state.sent();
          options = minimist(getArgv());
          if (options["api-only"]) {
            return [
              2,
              true
            ];
          }
          return [
            2,
            existApi && !existSrc
          ];
      }
    });
  });
  return function isApiOnly2(appDirectory, entryDir, apiDir) {
    return _ref.apply(this, arguments);
  };
}();
var isWebOnly = function() {
  var _ref = _async_to_generator(function() {
    var options;
    return _ts_generator(this, function(_state) {
      options = minimist(getArgv());
      return [
        2,
        Boolean(options["web-only"])
      ];
    });
  });
  return function isWebOnly2() {
    return _ref.apply(this, arguments);
  };
}();
var isVersionBeyond17 = function(version) {
  return semver.gte(semver.minVersion(version), "17.0.0");
};
var getReactVersion = function(cwd) {
  var pkgPath = pkgUp.sync({
    cwd
  });
  if (!pkgPath) {
    return false;
  }
  var pkgInfo = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  var deps = _object_spread({}, pkgInfo.devDependencies, pkgInfo.dependencies);
  if (typeof deps.react !== "string") {
    return false;
  }
  try {
    var reactPath = require.resolve("react/package.json", {
      paths: [
        cwd
      ]
    });
    var reactVersion = JSON.parse(fs.readFileSync(reactPath, "utf8")).version;
    return reactVersion;
  } catch (error) {
    console.error("Failed to resolve React version:", error);
    return false;
  }
};
var isBeyondReact17 = function(cwd) {
  var reactVersion = getReactVersion(cwd);
  if (!reactVersion) {
    return false;
  }
  return isVersionBeyond17(reactVersion);
};
var isSupportAutomaticJsx = function(cwd) {
  var reactVersion = getReactVersion(cwd);
  if (!reactVersion) {
    return false;
  }
  return semver.satisfies(semver.minVersion(reactVersion), ">=16.14.0");
};
var isReact18 = function() {
  var cwd = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : process.cwd();
  var reactVersion = getReactVersion(cwd);
  if (!reactVersion) {
    return false;
  }
  return semver.gte(semver.minVersion(reactVersion), "18.0.0");
};
var isTypescript = function(root) {
  return fs.existsSync(path.resolve(root, "./tsconfig.json"));
};
export {
  getReactVersion,
  isApiOnly,
  isBeyondReact17,
  isDepExists,
  isPackageInstalled,
  isReact18,
  isSupportAutomaticJsx,
  isTypescript,
  isVersionBeyond17,
  isWebOnly
};
