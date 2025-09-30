import fs from "fs";
import os from "os";
import path from "path";
import { nanoid, upath } from "../compiled";
const isPathString = (test) => path.posix.basename(test) !== test || path.win32.basename(test) !== test;
const isRelativePath = (test) => /^\.\.?($|[\\/])/.test(test);
const normalizeOutputPath = (s) => s.replace(/\\/g, "\\\\");
const normalizeToPosixPath = (p) => upath.normalizeSafe(path.normalize(p || "")).replace(/^([a-zA-Z]+):/, (_, m) => `/${m.toLowerCase()}`);
const getTemplatePath = (prefix) => {
  const tmpRoot = fs.realpathSync(os.tmpdir());
  const parts = [
    tmpRoot
  ];
  prefix && parts.push(prefix);
  parts.push(nanoid());
  return path.resolve(...parts);
};
function getRealTemporaryDirectory() {
  let ret = null;
  try {
    ret = os.tmpdir();
    ret = fs.realpathSync(ret);
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
