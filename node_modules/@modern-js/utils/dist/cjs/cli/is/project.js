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
var project_exports = {};
__export(project_exports, {
  getReactVersion: () => getReactVersion,
  isApiOnly: () => isApiOnly,
  isBeyondReact17: () => isBeyondReact17,
  isDepExists: () => isDepExists,
  isPackageInstalled: () => isPackageInstalled,
  isReact18: () => isReact18,
  isSupportAutomaticJsx: () => isSupportAutomaticJsx,
  isTypescript: () => isTypescript,
  isVersionBeyond17: () => isVersionBeyond17,
  isWebOnly: () => isWebOnly
});
module.exports = __toCommonJS(project_exports);
var import_path = __toESM(require("path"));
var import_pkg_up = __toESM(require("../../../compiled/pkg-up"));
var import_compiled = require("../../compiled");
var import_commands = require("../commands");
var import_common = require("../common");
var import_ensure = require("../ensure");
const debug = (0, import_common.createDebugger)("judge-depExists");
const isDepExists = (appDirectory, name) => {
  const pkgPath = import_path.default.resolve(appDirectory, "./package.json");
  if (!import_compiled.fs.existsSync(pkgPath)) {
    debug(`can't find package.json under: %s`, appDirectory);
    return false;
  }
  const json = require(pkgPath);
  const { dependencies = {}, devDependencies = {} } = json;
  return dependencies.hasOwnProperty(name) || devDependencies.hasOwnProperty(name);
};
const isPackageInstalled = (name, resolvePaths) => {
  try {
    require.resolve(name, {
      paths: (0, import_ensure.ensureArray)(resolvePaths)
    });
    return true;
  } catch (err) {
    return false;
  }
};
const isApiOnly = async (appDirectory, entryDir, apiDir) => {
  const existApi = await import_compiled.fs.pathExists(apiDir !== null && apiDir !== void 0 ? apiDir : import_path.default.join(appDirectory, "api"));
  const existSrc = await import_compiled.fs.pathExists(import_path.default.join(appDirectory, entryDir !== null && entryDir !== void 0 ? entryDir : "src"));
  const options = (0, import_compiled.minimist)((0, import_commands.getArgv)());
  if (options["api-only"]) {
    return true;
  }
  return existApi && !existSrc;
};
const isWebOnly = async () => {
  const options = (0, import_compiled.minimist)((0, import_commands.getArgv)());
  return Boolean(options["web-only"]);
};
const isVersionBeyond17 = (version) => {
  return import_compiled.semver.gte(import_compiled.semver.minVersion(version), "17.0.0");
};
const getReactVersion = (cwd) => {
  const pkgPath = import_pkg_up.default.sync({
    cwd
  });
  if (!pkgPath) {
    return false;
  }
  const pkgInfo = JSON.parse(import_compiled.fs.readFileSync(pkgPath, "utf8"));
  const deps = {
    ...pkgInfo.devDependencies,
    ...pkgInfo.dependencies
  };
  if (typeof deps.react !== "string") {
    return false;
  }
  try {
    const reactPath = require.resolve("react/package.json", {
      paths: [
        cwd
      ]
    });
    const reactVersion = JSON.parse(import_compiled.fs.readFileSync(reactPath, "utf8")).version;
    return reactVersion;
  } catch (error) {
    console.error("Failed to resolve React version:", error);
    return false;
  }
};
const isBeyondReact17 = (cwd) => {
  const reactVersion = getReactVersion(cwd);
  if (!reactVersion) {
    return false;
  }
  return isVersionBeyond17(reactVersion);
};
const isSupportAutomaticJsx = (cwd) => {
  const reactVersion = getReactVersion(cwd);
  if (!reactVersion) {
    return false;
  }
  return import_compiled.semver.satisfies(import_compiled.semver.minVersion(reactVersion), ">=16.14.0");
};
const isReact18 = (cwd = process.cwd()) => {
  const reactVersion = getReactVersion(cwd);
  if (!reactVersion) {
    return false;
  }
  return import_compiled.semver.gte(import_compiled.semver.minVersion(reactVersion), "18.0.0");
};
const isTypescript = (root) => import_compiled.fs.existsSync(import_path.default.resolve(root, "./tsconfig.json"));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
