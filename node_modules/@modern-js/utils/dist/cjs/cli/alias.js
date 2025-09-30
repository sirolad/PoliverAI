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
var alias_exports = {};
__export(alias_exports, {
  getAliasConfig: () => getAliasConfig,
  getUserAlias: () => getUserAlias,
  mergeAlias: () => mergeAlias
});
module.exports = __toCommonJS(alias_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_applyOptionsChain = require("./applyOptionsChain");
var import_get = require("./get");
const mergeAlias = (alias) => (0, import_applyOptionsChain.applyOptionsChain)({}, alias);
const getAliasConfig = (aliasOption, option) => {
  var _tsconfig_compilerOptions, _tsconfig_compilerOptions1;
  const isTsProject = import_fs.default.existsSync(option.tsconfigPath);
  const alias = mergeAlias(aliasOption);
  if (!isTsProject) {
    return {
      absoluteBaseUrl: option.appDirectory,
      paths: alias,
      isTsPath: false,
      isTsProject
    };
  }
  const tsconfig = (0, import_get.readTsConfigByFile)(option.tsconfigPath);
  const baseUrl = tsconfig === null || tsconfig === void 0 ? void 0 : (_tsconfig_compilerOptions = tsconfig.compilerOptions) === null || _tsconfig_compilerOptions === void 0 ? void 0 : _tsconfig_compilerOptions.baseUrl;
  return {
    absoluteBaseUrl: baseUrl ? import_path.default.join(option.appDirectory, baseUrl) : option.appDirectory,
    paths: {
      ...alias,
      ...tsconfig === null || tsconfig === void 0 ? void 0 : (_tsconfig_compilerOptions1 = tsconfig.compilerOptions) === null || _tsconfig_compilerOptions1 === void 0 ? void 0 : _tsconfig_compilerOptions1.paths
    },
    isTsPath: true,
    isTsProject
  };
};
const getUserAlias = (alias = {}) => Object.keys(alias).reduce((o, k) => {
  if (Array.isArray(alias[k])) {
    o[k] = alias[k];
  }
  return o;
}, {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAliasConfig,
  getUserAlias,
  mergeAlias
});
