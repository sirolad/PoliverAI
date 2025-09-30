import fs from "fs";
import path from "path";
import { applyOptionsChain } from "./applyOptionsChain";
import { readTsConfigByFile } from "./get";
const mergeAlias = (alias) => applyOptionsChain({}, alias);
const getAliasConfig = (aliasOption, option) => {
  var _tsconfig_compilerOptions, _tsconfig_compilerOptions1;
  const isTsProject = fs.existsSync(option.tsconfigPath);
  const alias = mergeAlias(aliasOption);
  if (!isTsProject) {
    return {
      absoluteBaseUrl: option.appDirectory,
      paths: alias,
      isTsPath: false,
      isTsProject
    };
  }
  const tsconfig = readTsConfigByFile(option.tsconfigPath);
  const baseUrl = tsconfig === null || tsconfig === void 0 ? void 0 : (_tsconfig_compilerOptions = tsconfig.compilerOptions) === null || _tsconfig_compilerOptions === void 0 ? void 0 : _tsconfig_compilerOptions.baseUrl;
  return {
    absoluteBaseUrl: baseUrl ? path.join(option.appDirectory, baseUrl) : option.appDirectory,
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
export {
  getAliasConfig,
  getUserAlias,
  mergeAlias
};
