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
var common_exports = {};
__export(common_exports, {
  clearConsole: () => clearConsole,
  createDebugger: () => createDebugger,
  wait: () => wait
});
module.exports = __toCommonJS(common_exports);
var import_debug = require("../../compiled/debug");
const createDebugger = (scope) => (0, import_debug.debug)(`modern-js:${scope}`);
const clearConsole = () => {
  if (process.stdout.isTTY && !process.env.DEBUG) {
    process.stdout.write("\x1B[H\x1B[2J");
  }
};
const wait = (time = 0) => new Promise((resolve) => {
  setTimeout(resolve, time);
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  clearConsole,
  createDebugger,
  wait
});
