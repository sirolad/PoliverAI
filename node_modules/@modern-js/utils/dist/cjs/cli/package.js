"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var package_exports = {};
__export(package_exports, {
  canUseNpm: () => canUseNpm,
  canUsePnpm: () => canUsePnpm,
  canUseYarn: () => canUseYarn,
  getPnpmVersion: () => getPnpmVersion,
  removeModuleSyncFromExports: () => removeModuleSyncFromExports
});
module.exports = __toCommonJS(package_exports);
var import_compiled = require("../compiled");
async function getPnpmVersion() {
  const { stdout } = await (0, import_compiled.execa)("pnpm", [
    "--version"
  ]);
  return stdout;
}
async function canUseNpm() {
  try {
    await (0, import_compiled.execa)("npm", [
      "--version"
    ], {
      env: process.env
    });
    return true;
  } catch (e) {
    return false;
  }
}
async function canUseYarn() {
  try {
    await (0, import_compiled.execa)("yarn", [
      "--version"
    ], {
      env: process.env
    });
    return true;
  } catch (e) {
    return false;
  }
}
async function canUsePnpm() {
  try {
    await (0, import_compiled.execa)("pnpm", [
      "--version"
    ], {
      env: process.env
    });
    return true;
  } catch (e) {
    return false;
  }
}
function removeModuleSyncFromExports(exports) {
  if (typeof exports !== "object" || exports === null) {
    return exports;
  }
  if (Array.isArray(exports)) {
    return exports.map(removeModuleSyncFromExports);
  }
  const result = {};
  for (const [key, value] of Object.entries(exports)) {
    if (key === "module-sync") {
      continue;
    }
    result[key] = removeModuleSyncFromExports(value);
  }
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  canUseNpm,
  canUsePnpm,
  canUseYarn,
  getPnpmVersion,
  removeModuleSyncFromExports
});
