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
var runtimeExports_exports = {};
__export(runtimeExports_exports, {
  createRuntimeExportsUtils: () => createRuntimeExportsUtils
});
module.exports = __toCommonJS(runtimeExports_exports);
var import_path = __toESM(require("path"));
var import_compiled = require("../compiled");
var import_path2 = require("./path");
const memo = (fn) => {
  const cache = /* @__PURE__ */ new Map();
  return (...params) => {
    const stringifiedParams = JSON.stringify(params);
    const cachedResult = cache.get(stringifiedParams);
    if (cachedResult) {
      return cachedResult;
    }
    const res = fn(...params);
    cache.set(stringifiedParams, res);
    return res;
  };
};
const createRuntimeExportsUtils = memo((pwd = "", namespace = "index") => {
  const entryExportFile = import_path.default.join(pwd, `.runtime-exports/${namespace}.js`);
  const addExport = (statement) => {
    const statementStr = (0, import_path2.normalizeOutputPath)(statement);
    try {
      import_compiled.fs.ensureFileSync(entryExportFile);
      if (!import_compiled.fs.readFileSync(entryExportFile, "utf8").includes(statementStr)) {
        import_compiled.fs.appendFileSync(entryExportFile, `${statementStr}
`);
      }
    } catch {
    }
  };
  const getPath = () => entryExportFile;
  return {
    addExport,
    getPath
  };
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createRuntimeExportsUtils
});
