"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var cli_exports = {};
module.exports = __toCommonJS(cli_exports);
__reExport(cli_exports, require("./constants"), module.exports);
__reExport(cli_exports, require("./get"), module.exports);
__reExport(cli_exports, require("./is"), module.exports);
__reExport(cli_exports, require("./alias"), module.exports);
__reExport(cli_exports, require("./applyOptionsChain"), module.exports);
__reExport(cli_exports, require("./babel"), module.exports);
__reExport(cli_exports, require("./commands"), module.exports);
__reExport(cli_exports, require("./common"), module.exports);
__reExport(cli_exports, require("./ensure"), module.exports);
__reExport(cli_exports, require("./fs"), module.exports);
__reExport(cli_exports, require("./logger"), module.exports);
__reExport(cli_exports, require("./monorepo"), module.exports);
__reExport(cli_exports, require("./package"), module.exports);
__reExport(cli_exports, require("./path"), module.exports);
__reExport(cli_exports, require("./port"), module.exports);
__reExport(cli_exports, require("./prettyInstructions"), module.exports);
__reExport(cli_exports, require("./require"), module.exports);
__reExport(cli_exports, require("./runtimeExports"), module.exports);
__reExport(cli_exports, require("./watch"), module.exports);
__reExport(cli_exports, require("./config"), module.exports);
__reExport(cli_exports, require("./action"), module.exports);
__reExport(cli_exports, require("./version"), module.exports);
__reExport(cli_exports, require("./route"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ...require("./constants"),
  ...require("./get"),
  ...require("./is"),
  ...require("./alias"),
  ...require("./applyOptionsChain"),
  ...require("./babel"),
  ...require("./commands"),
  ...require("./common"),
  ...require("./ensure"),
  ...require("./fs"),
  ...require("./logger"),
  ...require("./monorepo"),
  ...require("./package"),
  ...require("./path"),
  ...require("./port"),
  ...require("./prettyInstructions"),
  ...require("./require"),
  ...require("./runtimeExports"),
  ...require("./watch"),
  ...require("./config"),
  ...require("./action"),
  ...require("./version"),
  ...require("./route")
});
