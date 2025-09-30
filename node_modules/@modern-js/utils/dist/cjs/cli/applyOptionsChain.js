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
var applyOptionsChain_exports = {};
__export(applyOptionsChain_exports, {
  applyOptionsChain: () => applyOptionsChain
});
module.exports = __toCommonJS(applyOptionsChain_exports);
var import_is = require("./is");
var import_logger = require("./logger");
function applyOptionsChain(defaults, options, utils, mergeFn = Object.assign) {
  if (!options) {
    return defaults;
  }
  if ((0, import_is.isPlainObject)(options)) {
    return mergeFn(defaults, options);
  } else if ((0, import_is.isFunction)(options)) {
    const ret = options(defaults, utils);
    if (ret) {
      if (!(0, import_is.isPlainObject)(ret)) {
        import_logger.logger.warn(`${options.name}: Function should mutate the config and return nothing, Or return a cloned or merged version of config object.`);
      }
      return ret;
    }
  } else if (Array.isArray(options)) {
    return options.reduce((memo, cur) => applyOptionsChain(memo, cur, utils, mergeFn), defaults);
  } else {
    throw new Error(`applyOptionsChain error:
default options is: ${JSON.stringify(defaults)}`);
  }
  return defaults;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  applyOptionsChain
});
