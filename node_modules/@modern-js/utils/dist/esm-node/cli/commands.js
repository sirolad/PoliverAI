import { logger } from "./logger";
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
      logger.warn('The "modern lint" command is deprecated, please use "eslint" or "biome" instead.');
    });
  }
  const preCommitCommand = (_program_commandsMap1 = program.commandsMap) === null || _program_commandsMap1 === void 0 ? void 0 : _program_commandsMap1.get("pre-commit");
  if (!preCommitCommand) {
    program.command("pre-commit").description("Deprecated").action(() => {
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
