"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var require_exports = {};
__export(require_exports, {
  cleanRequireCache: () => cleanRequireCache,
  compatibleRequire: () => compatibleRequire,
  deleteRequireCache: () => deleteRequireCache,
  dynamicImport: () => dynamicImport,
  loadFromProject: () => loadFromProject,
  requireExistModule: () => requireExistModule,
  tryResolve: () => tryResolve
});
module.exports = __toCommonJS(require_exports);
var import_node_path = require("node:path");
var import_node_url = require("node:url");
var import_fs = require("./fs");
const import_meta = {};
async function compatibleRequire(path, interop = true) {
  if (path.endsWith(".json")) {
    return require(path);
  }
  let requiredModule;
  try {
    requiredModule = require(path);
  } catch (err) {
    if (err.code === "ERR_REQUIRE_ESM") {
      const modulePath = (0, import_node_path.isAbsolute)(path) ? (0, import_node_url.pathToFileURL)(path).href : path;
      if (process.env.NODE_ENV === "development") {
        const timestamp = Date.now();
        requiredModule = await import(`${modulePath}?t=${timestamp}`);
      } else {
        requiredModule = await import(modulePath);
      }
      return interop ? requiredModule.default : requiredModule;
    } else {
      throw err;
    }
  }
  return interop && (requiredModule === null || requiredModule === void 0 ? void 0 : requiredModule.__esModule) ? requiredModule.default : requiredModule;
}
async function loadFromProject(moduleName, appDir) {
  let requiredModule;
  const paths = [
    appDir,
    process.cwd()
  ];
  try {
    if (typeof require !== "undefined") {
      const modulePath = require.resolve(moduleName, {
        paths
      });
      requiredModule = require(modulePath);
    } else {
      const { createRequire } = await import("node:module");
      const require1 = createRequire(import_meta.url);
      const modulePath = require1.resolve(moduleName, {
        paths
      });
      const moduleUrl = (0, import_node_url.pathToFileURL)(modulePath).href;
      requiredModule = await import(moduleUrl);
    }
    return requiredModule.default || requiredModule;
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      throw new Error(`Cannot find module ${moduleName}.`);
    }
    throw error;
  }
}
const dynamicImport = new Function("modulePath", "return import(modulePath)");
const requireExistModule = async (filename, opt) => {
  const final = {
    extensions: [
      ".ts",
      ".js"
    ],
    interop: true,
    ...opt
  };
  const exist = (0, import_fs.findExists)(final.extensions.map((ext) => `${filename}${ext}`));
  if (!exist) {
    return null;
  }
  return compatibleRequire(exist, final.interop);
};
const cleanRequireCache = (filelist) => {
  filelist.forEach((filepath) => {
    delete require.cache[filepath];
  });
};
function deleteRequireCache(path) {
  if (require.cache[path]) {
    delete require.cache[path];
  }
  if (module.children) {
    module.children = module.children.filter((item) => item.filename !== path);
  }
}
const tryResolve = (name, resolvePath) => {
  let filePath = "";
  try {
    filePath = require.resolve(name, {
      paths: [
        resolvePath
      ]
    });
    delete require.cache[filePath];
  } catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
      throw new Error(`Can not find module ${name}.`);
    }
    throw err;
  }
  return filePath;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cleanRequireCache,
  compatibleRequire,
  deleteRequireCache,
  dynamicImport,
  loadFromProject,
  requireExistModule,
  tryResolve
});
