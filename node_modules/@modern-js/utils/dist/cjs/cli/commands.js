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
var commands_exports = {};
__export(commands_exports, {
  deprecatedCommands: () => deprecatedCommands,
  getArgv: () => getArgv,
  getCommand: () => getCommand,
  getFullArgv: () => getFullArgv,
  isDevCommand: () => isDevCommand
});
module.exports = __toCommonJS(commands_exports);
var import_logger = require("./logger");
const getFullArgv = () => {
  var _process_env_MODERN_ARGV;
  return ((_process_env_MODERN_ARGV = process.env.MODERN_ARGV) === null || _process_env_MODERN_ARGV === void 0 ? void 0 : _process_env_MODERN_ARGV.split(" ")) || process.argv;
};
const getArgv = () => {
  return getFullArgv().slice(2);
};
const getCommand = () => {
  const args = getArgv();
  const command = args[0];
  return command;
};
const isDevCommand = () => {
  const command = getCommand();
  return command === "dev" || command === "start";
};
const deprecatedCommands = (program) => {
  var _program_commandsMap, _program_commandsMap1;
  const lintCommand = (_program_commandsMap = program.commandsMap) === null || _program_commandsMap === void 0 ? void 0 : _program_commandsMap.get("lint");
  if (!lintCommand) {
    program.command("lint [...files]").allowUnknownOption().description("Deprecated").action(() => {
      import_logger.logger.warn('The "modern lint" command is deprecated, please use "eslint" or "biome" instead.');
    });
  }
  const preCommitCommand = (_program_commandsMap1 = program.commandsMap) === null || _program_commandsMap1 === void 0 ? void 0 : _program_commandsMap1.get("pre-commit");
  if (!preCommitCommand) {
    program.command("pre-commit").description("Deprecated").action(() => {
      import_logger.logger.warn('The "modern pre-commit" command is deprecated, please use "lint-staged" instead.');
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  deprecatedCommands,
  getArgv,
  getCommand,
  getFullArgv,
  isDevCommand
});
