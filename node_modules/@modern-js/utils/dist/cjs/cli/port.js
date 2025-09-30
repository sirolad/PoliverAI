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
var port_exports = {};
__export(port_exports, {
  getPort: () => getPort
});
module.exports = __toCommonJS(port_exports);
var import_net = __toESM(require("net"));
var import_compiled = require("../compiled");
var import_logger = require("./logger");
const getPort = async (expectPort, { tryLimits = 20, strictPort = false, slient = false } = {}) => {
  let port = expectPort;
  if (typeof port === "string") {
    port = parseInt(port, 10);
  }
  if (strictPort) {
    tryLimits = 1;
  }
  const original = port;
  let found = false;
  let attempts = 0;
  while (!found && attempts <= tryLimits) {
    try {
      await new Promise((resolve, reject) => {
        const server = import_net.default.createServer();
        server.unref();
        server.on("error", reject);
        server.listen({
          port,
          host: "0.0.0.0"
        }, () => {
          found = true;
          server.close(resolve);
        });
      });
    } catch (e) {
      if (e.code !== "EADDRINUSE") {
        throw e;
      }
      port++;
      attempts++;
    }
  }
  if (port !== original) {
    if (strictPort) {
      throw new Error(`Port "${original}" is occupied, please choose another one.`);
    } else if (!slient) {
      import_logger.logger.info(`Port ${original} is in use. ${import_compiled.chalk.yellow(`using port ${port}.`)}`);
    }
  }
  return port;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPort
});
