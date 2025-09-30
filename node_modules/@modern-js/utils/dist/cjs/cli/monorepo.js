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
var monorepo_exports = {};
__export(monorepo_exports, {
  findMonorepoRoot: () => findMonorepoRoot,
  getMonorepoPackages: () => getMonorepoPackages,
  isLerna: () => isLerna,
  isMonorepo: () => isMonorepo,
  isPnpmWorkspaces: () => isPnpmWorkspaces,
  isYarnWorkspaces: () => isYarnWorkspaces
});
module.exports = __toCommonJS(monorepo_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_compiled = require("../compiled");
const PACKAGE_MAX_DEPTH = 5;
const WORKSPACE_FILES = {
  YARN: "package.json",
  PNPM: "pnpm-workspace.yaml",
  LERNA: "lerna.json"
};
const isLerna = (root) => import_fs.default.existsSync(import_path.default.join(root, WORKSPACE_FILES.LERNA));
const isYarnWorkspaces = (root) => {
  var _json_workspaces;
  const pkg = import_path.default.join(root, WORKSPACE_FILES.YARN);
  if (!import_fs.default.existsSync(pkg)) {
    return false;
  }
  const json = JSON.parse(import_fs.default.readFileSync(pkg, "utf8"));
  return Boolean((_json_workspaces = json.workspaces) === null || _json_workspaces === void 0 ? void 0 : _json_workspaces.packages);
};
const isPnpmWorkspaces = (root) => import_fs.default.existsSync(import_path.default.join(root, WORKSPACE_FILES.PNPM));
const isMonorepo = (root) => isLerna(root) || isYarnWorkspaces(root) || isPnpmWorkspaces(root);
const findMonorepoRoot = (appDirectory, maxDepth = PACKAGE_MAX_DEPTH) => {
  let inMonorepo = false;
  let monorepoRoot = appDirectory;
  for (let depth = 0; depth < maxDepth; depth++) {
    if (isMonorepo(appDirectory)) {
      inMonorepo = true;
      break;
    }
    monorepoRoot = import_path.default.dirname(appDirectory);
  }
  return inMonorepo ? monorepoRoot : void 0;
};
const getMonorepoPackages = (root) => {
  let packages = [];
  if (isYarnWorkspaces(root)) {
    const json = JSON.parse(import_fs.default.readFileSync(import_path.default.join(root, "package.json"), "utf8"));
    ({ packages } = json.workspaces);
  } else if (isLerna(root)) {
    const json = JSON.parse(import_fs.default.readFileSync(import_path.default.resolve(root, "lerna.json"), "utf8"));
    ({ packages } = json);
  } else {
    ({ packages } = import_compiled.yaml.load(import_fs.default.readFileSync(import_path.default.join(root, WORKSPACE_FILES.PNPM), "utf8")));
  }
  if (packages) {
    return packages.map((name) => (
      // The trailing / ensures only dirs are picked up
      import_compiled.glob.sync(import_path.default.join(root, `${name}/`), {
        ignore: [
          "**/node_modules/**"
        ]
      })
    )).reduce((acc, val) => acc.concat(val), []).filter((filepath) => import_fs.default.existsSync(import_path.default.resolve(filepath, "package.json"))).map((filepath) => ({
      path: filepath,
      name: JSON.parse(import_fs.default.readFileSync(import_path.default.resolve(filepath, "package.json"), "utf8")).name
    }));
  }
  return [];
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  findMonorepoRoot,
  getMonorepoPackages,
  isLerna,
  isMonorepo,
  isPnpmWorkspaces,
  isYarnWorkspaces
});
