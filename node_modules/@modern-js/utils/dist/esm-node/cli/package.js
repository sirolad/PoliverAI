import { execa } from "../compiled";
async function getPnpmVersion() {
  const { stdout } = await execa("pnpm", [
    "--version"
  ]);
  return stdout;
}
async function canUseNpm() {
  try {
    await execa("npm", [
      "--version"
    ], {
      env: process.env
    });
    return true;
  } catch (e) {
    return false;
  }
}
async function canUseYarn() {
  try {
    await execa("yarn", [
      "--version"
    ], {
      env: process.env
    });
    return true;
  } catch (e) {
    return false;
  }
}
async function canUsePnpm() {
  try {
    await execa("pnpm", [
      "--version"
    ], {
      env: process.env
    });
    return true;
  } catch (e) {
    return false;
  }
}
function removeModuleSyncFromExports(exports) {
  if (typeof exports !== "object" || exports === null) {
    return exports;
  }
  if (Array.isArray(exports)) {
    return exports.map(removeModuleSyncFromExports);
  }
  const result = {};
  for (const [key, value] of Object.entries(exports)) {
    if (key === "module-sync") {
      continue;
    }
    result[key] = removeModuleSyncFromExports(value);
  }
  return result;
}
export {
  canUseNpm,
  canUsePnpm,
  canUseYarn,
  getPnpmVersion,
  removeModuleSyncFromExports
};
