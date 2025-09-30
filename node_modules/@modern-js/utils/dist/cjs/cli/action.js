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
var action_exports = {};
__export(action_exports, {
  newAction: () => newAction,
  upgradeAction: () => upgradeAction
});
module.exports = __toCommonJS(action_exports);
var import_compiled = require("../compiled");
const newAction = async (config, solution) => {
  var _process_env_MODERN_JS_VERSION;
  await (0, import_compiled.execa)("npx", [
    "--yes",
    `@modern-js/new-action@${(_process_env_MODERN_JS_VERSION = process.env.MODERN_JS_VERSION) !== null && _process_env_MODERN_JS_VERSION !== void 0 ? _process_env_MODERN_JS_VERSION : "latest"}`,
    `--config=${JSON.stringify(config)}`,
    `--solution=${solution}`
  ], {
    stderr: "inherit",
    stdout: "inherit",
    stdin: "inherit"
  });
};
const upgradeAction = async () => {
  var _process_env_MODERN_JS_VERSION;
  await (0, import_compiled.execa)("npx", [
    "--yes",
    `@modern-js/upgrade@${(_process_env_MODERN_JS_VERSION = process.env.MODERN_JS_VERSION) !== null && _process_env_MODERN_JS_VERSION !== void 0 ? _process_env_MODERN_JS_VERSION : "latest"}`,
    ...process.argv.slice(2)
  ], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit"
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  newAction,
  upgradeAction
});
