import { _ as _async_to_generator } from "@swc/helpers/_/_async_to_generator";
import { _ as _object_spread } from "@swc/helpers/_/_object_spread";
import { _ as _ts_generator } from "@swc/helpers/_/_ts_generator";
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { findExists } from "./fs";
function compatibleRequire(path) {
  return _compatibleRequire.apply(this, arguments);
}
function _compatibleRequire() {
  _compatibleRequire = _async_to_generator(function(path) {
    var interop, requiredModule, err, modulePath, timestamp;
    var _arguments = arguments;
    return _ts_generator(this, function(_state) {
      switch (_state.label) {
        case 0:
          interop = _arguments.length > 1 && _arguments[1] !== void 0 ? _arguments[1] : true;
          if (path.endsWith(".json")) {
            return [
              2,
              require(path)
            ];
          }
          _state.label = 1;
        case 1:
          _state.trys.push([
            1,
            2,
            ,
            9
          ]);
          requiredModule = require(path);
          return [
            3,
            9
          ];
        case 2:
          err = _state.sent();
          if (!(err.code === "ERR_REQUIRE_ESM"))
            return [
              3,
              7
            ];
          modulePath = isAbsolute(path) ? pathToFileURL(path).href : path;
          if (!(process.env.NODE_ENV === "development"))
            return [
              3,
              4
            ];
          timestamp = Date.now();
          return [
            4,
            import("".concat(modulePath, "?t=").concat(timestamp))
          ];
        case 3:
          requiredModule = _state.sent();
          return [
            3,
            6
          ];
        case 4:
          return [
            4,
            import(modulePath)
          ];
        case 5:
          requiredModule = _state.sent();
          _state.label = 6;
        case 6:
          return [
            2,
            interop ? requiredModule.default : requiredModule
          ];
        case 7:
          throw err;
        case 8:
          return [
            3,
            9
          ];
        case 9:
          return [
            2,
            interop && (requiredModule === null || requiredModule === void 0 ? void 0 : requiredModule.__esModule) ? requiredModule.default : requiredModule
          ];
      }
    });
  });
  return _compatibleRequire.apply(this, arguments);
}
function loadFromProject(moduleName, appDir) {
  return _loadFromProject.apply(this, arguments);
}
function _loadFromProject() {
  _loadFromProject = _async_to_generator(function(moduleName, appDir) {
    var requiredModule, paths, modulePath, createRequire, _$require, modulePath1, moduleUrl, error;
    return _ts_generator(this, function(_state) {
      switch (_state.label) {
        case 0:
          paths = [
            appDir,
            process.cwd()
          ];
          _state.label = 1;
        case 1:
          _state.trys.push([
            1,
            6,
            ,
            7
          ]);
          if (!(typeof require !== "undefined"))
            return [
              3,
              2
            ];
          modulePath = require.resolve(moduleName, {
            paths
          });
          requiredModule = require(modulePath);
          return [
            3,
            5
          ];
        case 2:
          return [
            4,
            import("node:module")
          ];
        case 3:
          createRequire = _state.sent().createRequire;
          _$require = createRequire(import.meta.url);
          modulePath1 = _$require.resolve(moduleName, {
            paths
          });
          moduleUrl = pathToFileURL(modulePath1).href;
          return [
            4,
            import(moduleUrl)
          ];
        case 4:
          requiredModule = _state.sent();
          _state.label = 5;
        case 5:
          return [
            2,
            requiredModule.default || requiredModule
          ];
        case 6:
          error = _state.sent();
          if (error.code === "MODULE_NOT_FOUND") {
            throw new Error("Cannot find module ".concat(moduleName, "."));
          }
          throw error;
        case 7:
          return [
            2
          ];
      }
    });
  });
  return _loadFromProject.apply(this, arguments);
}
var dynamicImport = new Function("modulePath", "return import(modulePath)");
var requireExistModule = function() {
  var _ref = _async_to_generator(function(filename, opt) {
    var final, exist;
    return _ts_generator(this, function(_state) {
      final = _object_spread({
        extensions: [
          ".ts",
          ".js"
        ],
        interop: true
      }, opt);
      exist = findExists(final.extensions.map(function(ext) {
        return "".concat(filename).concat(ext);
      }));
      if (!exist) {
        return [
          2,
          null
        ];
      }
      return [
        2,
        compatibleRequire(exist, final.interop)
      ];
    });
  });
  return function requireExistModule2(filename, opt) {
    return _ref.apply(this, arguments);
  };
}();
var cleanRequireCache = function(filelist) {
  filelist.forEach(function(filepath) {
    delete require.cache[filepath];
  });
};
function deleteRequireCache(path) {
  if (require.cache[path]) {
    delete require.cache[path];
  }
  if (module.children) {
    module.children = module.children.filter(function(item) {
      return item.filename !== path;
    });
  }
}
var tryResolve = function(name, resolvePath) {
  var filePath = "";
  try {
    filePath = require.resolve(name, {
      paths: [
        resolvePath
      ]
    });
    delete require.cache[filePath];
  } catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
      throw new Error("Can not find module ".concat(name, "."));
    }
    throw err;
  }
  return filePath;
};
export {
  cleanRequireCache,
  compatibleRequire,
  deleteRequireCache,
  dynamicImport,
  loadFromProject,
  requireExistModule,
  tryResolve
};
