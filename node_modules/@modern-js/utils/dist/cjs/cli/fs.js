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
var fs_exports = {};
__export(fs_exports, {
  emptyDir: () => emptyDir,
  findExists: () => findExists
});
module.exports = __toCommonJS(fs_exports);
var import_compiled = require("../compiled");
const findExists = (files) => {
  for (const file of files) {
    if (import_compiled.fs.existsSync(file) && import_compiled.fs.statSync(file).isFile()) {
      return file;
    }
  }
  return false;
};
const emptyDir = async (dir) => {
  if (await import_compiled.fs.pathExists(dir)) {
    await import_compiled.fs.emptyDir(dir);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  emptyDir,
  findExists
});
