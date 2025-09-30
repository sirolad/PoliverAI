import { execa } from "../compiled";
const newAction = async (config, solution) => {
  var _process_env_MODERN_JS_VERSION;
  await execa("npx", [
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
  await execa("npx", [
    "--yes",
    `@modern-js/upgrade@${(_process_env_MODERN_JS_VERSION = process.env.MODERN_JS_VERSION) !== null && _process_env_MODERN_JS_VERSION !== void 0 ? _process_env_MODERN_JS_VERSION : "latest"}`,
    ...process.argv.slice(2)
  ], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit"
  });
};
export {
  newAction,
  upgradeAction
};
