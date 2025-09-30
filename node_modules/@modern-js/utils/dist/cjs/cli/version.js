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
var version_exports = {};
__export(version_exports, {
  isVersionAtLeast18: () => isVersionAtLeast18,
  isVersionAtLeast1819: () => isVersionAtLeast1819,
  isVersionAtLeast20: () => isVersionAtLeast20,
  isVersionAtLeast22: () => isVersionAtLeast22
});
module.exports = __toCommonJS(version_exports);
function isVersionAtLeast1819() {
  const nodeVersion = process.versions.node;
  const versionArr = nodeVersion.split(".").map(Number);
  return versionArr[0] > 18 || versionArr[0] === 18 && versionArr[1] >= 19;
}
function isVersionAtLeast18() {
  const nodeVersion = process.versions.node;
  const versionArr = nodeVersion.split(".").map(Number);
  return versionArr[0] >= 18;
}
function isVersionAtLeast22() {
  const nodeVersion = process.versions.node;
  const versionArr = nodeVersion.split(".").map(Number);
  return versionArr[0] >= 22;
}
function isVersionAtLeast20() {
  const nodeVersion = process.versions.node;
  const versionArr = nodeVersion.split(".").map(Number);
  return versionArr[0] >= 20;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isVersionAtLeast18,
  isVersionAtLeast1819,
  isVersionAtLeast20,
  isVersionAtLeast22
});
