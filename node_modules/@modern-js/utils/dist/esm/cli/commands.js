import { logger } from "./logger";
var getFullArgv = function() {
  var _process_env_MODERN_ARGV;
  return ((_process_env_MODERN_ARGV = process.env.MODERN_ARGV) === null || _process_env_MODERN_ARGV === void 0 ? void 0 : _process_env_MODERN_ARGV.split(" ")) || process.argv;
};
var getArgv = function() {
  return getFullArgv().slice(2);
};
var getCommand = function() {
  var args = getArgv();
  var command = args[0];
  return command;
};
var isDevCommand = function() {
  var command = getCommand();
  return command === "dev" || command === "start";
};
var deprecatedCommands = function(program) {
  var _program_commandsMap, _program_commandsMap1;
  var lintCommand = (_program_commandsMap = program.commandsMap) === null || _program_commandsMap === void 0 ? void 0 : _program_commandsMap.get("lint");
  if (!lintCommand) {
    program.command("lint [...files]").allowUnknownOption().description("Deprecated").action(function() {
      logger.warn('The "modern lint" command is deprecated, please use "eslint" or "biome" instead.');
    });
  }
  var preCommitCommand = (_program_commandsMap1 = program.commandsMap) === null || _program_commandsMap1 === void 0 ? void 0 : _program_commandsMap1.get("pre-commit");
  if (!preCommitCommand) {
    program.command("pre-commit").description("Deprecated").action(function() {
      logger.warn('The "modern pre-commit" command is deprecated, please use "lint-staged" instead.');
    });
  }
};
export {
  deprecatedCommands,
  getArgv,
  getCommand,
  getFullArgv,
  isDevCommand
};
