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
var data_exports = {};
__export(data_exports, {
  defaults: () => defaults,
  getAntdMajorVersion: () => getAntdMajorVersion,
  getBrowserslist: () => getBrowserslist,
  getCoreJsVersion: () => getCoreJsVersion,
  getInternalPlugins: () => getInternalPlugins,
  getPackageManager: () => getPackageManager,
  readTsConfig: () => readTsConfig,
  readTsConfigByFile: () => readTsConfigByFile
});
module.exports = __toCommonJS(data_exports);
var import_os = __toESM(require("os"));
var import_path = __toESM(require("path"));
var import_compiled = require("../../compiled");
var import_constants = require("../constants");
var import_is = require("../is");
var import_package = require("../package");
const MAX_TIMES = 5;
async function getPackageManager(cwd = process.cwd()) {
  let appDirectory = cwd;
  let times = 0;
  while (import_os.default.homedir() !== appDirectory && times < MAX_TIMES) {
    times++;
    if (import_compiled.fs.existsSync(import_path.default.resolve(appDirectory, "pnpm-lock.yaml"))) {
      return "pnpm";
    }
    if (import_compiled.fs.existsSync(import_path.default.resolve(appDirectory, "yarn.lock"))) {
      return "yarn";
    }
    if (import_compiled.fs.existsSync(import_path.default.resolve(appDirectory, "package-lock.json"))) {
      return "npm";
    }
    appDirectory = import_path.default.join(appDirectory, "..");
  }
  if (await (0, import_package.canUsePnpm)()) {
    return "pnpm";
  }
  if (await (0, import_package.canUseYarn)()) {
    return "yarn";
  }
  return "npm";
}
const getCoreJsVersion = (corejsPkgPath) => {
  try {
    const { version } = import_compiled.fs.readJSONSync(corejsPkgPath);
    const [major, minor] = version.split(".");
    return `${major}.${minor}`;
  } catch (err) {
    return "3";
  }
};
const getAntdMajorVersion = (appDirectory) => {
  try {
    const pkgJsonPath = require.resolve("antd/package.json", {
      paths: [
        appDirectory
      ]
    });
    const { version } = require(pkgJsonPath);
    return Number(version.split(".")[0]);
  } catch (err) {
    return null;
  }
};
const defaults = [
  "> 0.01%",
  "not dead",
  "not op_mini all"
];
const getBrowserslist = (appDirectory) => import_compiled.browserslist.loadConfig({
  path: appDirectory
}) || defaults;
function getInternalPlugins(appDirectory, internalPlugins = import_constants.INTERNAL_CLI_PLUGINS) {
  return [
    ...Object.keys(internalPlugins).filter((name) => {
      const config = internalPlugins[name];
      if (typeof config !== "string" && config.forced === true) {
        return true;
      }
      return (0, import_is.isDepExists)(appDirectory, name);
    }).map((name) => {
      const config = internalPlugins[name];
      if (typeof config !== "string") {
        return config.path;
      } else {
        return config;
      }
    })
  ];
}
const readTsConfig = (root) => {
  return readTsConfigByFile(import_path.default.resolve(root, "./tsconfig.json"));
};
const readTsConfigByFile = (filename) => {
  const content = import_compiled.fs.readFileSync(import_path.default.resolve(filename), "utf-8");
  return import_compiled.json5.parse(content);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  defaults,
  getAntdMajorVersion,
  getBrowserslist,
  getCoreJsVersion,
  getInternalPlugins,
  getPackageManager,
  readTsConfig,
  readTsConfigByFile
});
