import { _ as _to_consumable_array } from "@swc/helpers/_/_to_consumable_array";
import fs from "fs";
import os from "os";
import path from "path";
import { nanoid, upath } from "../compiled";
var isPathString = function(test) {
  return path.posix.basename(test) !== test || path.win32.basename(test) !== test;
};
var isRelativePath = function(test) {
  return /^\.\.?($|[\\/])/.test(test);
};
var normalizeOutputPath = function(s) {
  return s.replace(/\\/g, "\\\\");
};
var normalizeToPosixPath = function(p) {
  return upath.normalizeSafe(path.normalize(p || "")).replace(/^([a-zA-Z]+):/, function(_, m) {
    return "/".concat(m.toLowerCase());
  });
};
var getTemplatePath = function(prefix) {
  var _path;
  var tmpRoot = fs.realpathSync(os.tmpdir());
  var parts = [
    tmpRoot
  ];
  prefix && parts.push(prefix);
  parts.push(nanoid());
  return (_path = path).resolve.apply(_path, _to_consumable_array(parts));
};
function getRealTemporaryDirectory() {
  var ret = null;
  try {
    ret = os.tmpdir();
    ret = fs.realpathSync(ret);
  } catch (e) {
  }
  return ret;
}
function splitPathString(str) {
  return str.split(/[\\/]/);
}
var removeLeadingSlash = function(s) {
  return s.replace(/^\/+/, "");
};
var removeTailSlash = function(s) {
  return s.replace(/\/+$/, "");
};
var removeSlash = function(s) {
  return removeLeadingSlash(removeTailSlash(s));
};
function formatImportPath(str) {
  return str.replace(/\\/g, "/");
}
export {
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
};
