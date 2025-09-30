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
var import_exports = {};
__export(import_exports, {
  Import: () => Import,
  lazyImport: () => lazy
});
module.exports = __toCommonJS(import_exports);
const lazy = (moduleName, requireFn) => {
  const importLazyLocal = require("../compiled/import-lazy")(requireFn);
  return importLazyLocal(moduleName);
};
const Import = {
  lazy
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Import,
  lazyImport
});
