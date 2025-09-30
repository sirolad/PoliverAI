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
var path_exports = {};
__export(path_exports, {
  formatImportPath: () => formatImportPath,
  getRealTemporaryDirectory: () => getRealTemporaryDirectory,
  getTemplatePath: () => getTemplatePath,
  isPathString: () => isPathString,
  isRelativePath: () => isRelativePath,
  normalizeOutputPath: () => normalizeOutputPath,
  normalizeToPosixPath: () => normalizeToPosixPath,
  removeLeadingSlash: () => removeLeadingSlash,
  removeSlash: () => removeSlash,
  removeTailSlash: () => removeTailSlash,
  splitPathString: () => splitPathString
});
module.exports = __toCommonJS(path_exports);
var import_fs = __toESM(require("fs"));
var import_os = __toESM(require("os"));
var import_path = __toESM(require("path"));
var import_compiled = require("../compiled");
const isPathString = (test) => import_path.default.posix.basename(test) !== test || import_path.default.win32.basename(test) !== test;
const isRelativePath = (test) => /^\.\.?($|[\\/])/.test(test);
const normalizeOutputPath = (s) => s.replace(/\\/g, "\\\\");
const normalizeToPosixPath = (p) => import_compiled.upath.normalizeSafe(import_path.default.normalize(p || "")).replace(/^([a-zA-Z]+):/, (_, m) => `/${m.toLowerCase()}`);
const getTemplatePath = (prefix) => {
  const tmpRoot = import_fs.default.realpathSync(import_os.default.tmpdir());
  const parts = [
    tmpRoot
  ];
  prefix && parts.push(prefix);
  parts.push((0, import_compiled.nanoid)());
  return import_path.default.resolve(...parts);
};
function getRealTemporaryDirectory() {
  let ret = null;
  try {
    ret = import_os.default.tmpdir();
    ret = import_fs.default.realpathSync(ret);
  } catch {
  }
  return ret;
}
function splitPathString(str) {
  return str.split(/[\\/]/);
}
const removeLeadingSlash = (s) => s.replace(/^\/+/, "");
const removeTailSlash = (s) => s.replace(/\/+$/, "");
const removeSlash = (s) => removeLeadingSlash(removeTailSlash(s));
function formatImportPath(str) {
  return str.replace(/\\/g, "/");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  formatImportPath,
  getRealTemporaryDirectory,
  getTemplatePath,
  isPathString,
  isRelativePath,
  normalizeOutputPath,
  normalizeToPosixPath,
  removeLeadingSlash,
  removeSlash,
  removeTailSlash,
  splitPathString
});
