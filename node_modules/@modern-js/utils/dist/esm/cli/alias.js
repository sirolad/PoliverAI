import { _ as _object_spread } from "@swc/helpers/_/_object_spread";
import fs from "fs";
import path from "path";
import { applyOptionsChain } from "./applyOptionsChain";
import { readTsConfigByFile } from "./get";
var mergeAlias = function(alias) {
  return applyOptionsChain({}, alias);
};
var getAliasConfig = function(aliasOption, option) {
  var _tsconfig_compilerOptions, _tsconfig_compilerOptions1;
  var isTsProject = fs.existsSync(option.tsconfigPath);
  var alias = mergeAlias(aliasOption);
  if (!isTsProject) {
    return {
      absoluteBaseUrl: option.appDirectory,
      paths: alias,
      isTsPath: false,
      isTsProject
    };
  }
  var tsconfig = readTsConfigByFile(option.tsconfigPath);
  var baseUrl = tsconfig === null || tsconfig === void 0 ? void 0 : (_tsconfig_compilerOptions = tsconfig.compilerOptions) === null || _tsconfig_compilerOptions === void 0 ? void 0 : _tsconfig_compilerOptions.baseUrl;
  return {
    absoluteBaseUrl: baseUrl ? path.join(option.appDirectory, baseUrl) : option.appDirectory,
    paths: _object_spread({}, alias, tsconfig === null || tsconfig === void 0 ? void 0 : (_tsconfig_compilerOptions1 = tsconfig.compilerOptions) === null || _tsconfig_compilerOptions1 === void 0 ? void 0 : _tsconfig_compilerOptions1.paths),
    isTsPath: true,
    isTsProject
  };
};
var getUserAlias = function() {
  var alias = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  return Object.keys(alias).reduce(function(o, k) {
    if (Array.isArray(alias[k])) {
      o[k] = alias[k];
    }
    return o;
  }, {});
};
export {
  getAliasConfig,
  getUserAlias,
  mergeAlias
};
