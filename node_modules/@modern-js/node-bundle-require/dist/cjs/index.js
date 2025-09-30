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
var src_exports = {};
__export(src_exports, {
  bundle: () => import_bundle.bundle,
  bundleRequire: () => bundleRequire,
  defaultGetOutputFile: () => import_bundle.defaultGetOutputFile
});
module.exports = __toCommonJS(src_exports);
var import_utils = require("@modern-js/utils");
var import_bundle = require("./bundle");
async function bundleRequire(filepath, options) {
  const configFile = await (0, import_bundle.bundle)(filepath, options);
  let mod;
  const req = (options === null || options === void 0 ? void 0 : options.require) || require;
  try {
    mod = await req(configFile);
    (0, import_utils.deleteRequireCache)(configFile);
  } finally {
    if ((options === null || options === void 0 ? void 0 : options.autoClear) === void 0 || options.autoClear) {
      import_utils.fs.unlinkSync(configFile);
    }
  }
  return mod;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  bundle,
  bundleRequire,
  defaultGetOutputFile
});
