import path from "path";
import pkgUp from "../../../compiled/pkg-up";
import { fs, minimist, semver } from "../../compiled";
import { getArgv } from "../commands";
import { createDebugger } from "../common";
import { ensureArray } from "../ensure";
const debug = createDebugger("judge-depExists");
const isDepExists = (appDirectory, name) => {
  const pkgPath = path.resolve(appDirectory, "./package.json");
  if (!fs.existsSync(pkgPath)) {
    debug(`can't find package.json under: %s`, appDirectory);
    return false;
  }
  const json = require(pkgPath);
  const { dependencies = {}, devDependencies = {} } = json;
  return dependencies.hasOwnProperty(name) || devDependencies.hasOwnProperty(name);
};
const isPackageInstalled = (name, resolvePaths) => {
  try {
    require.resolve(name, {
      paths: ensureArray(resolvePaths)
    });
    return true;
  } catch (err) {
    return false;
  }
};
const isApiOnly = async (appDirectory, entryDir, apiDir) => {
  const existApi = await fs.pathExists(apiDir !== null && apiDir !== void 0 ? apiDir : path.join(appDirectory, "api"));
  const existSrc = await fs.pathExists(path.join(appDirectory, entryDir !== null && entryDir !== void 0 ? entryDir : "src"));
  const options = minimist(getArgv());
  if (options["api-only"]) {
    return true;
  }
  return existApi && !existSrc;
};
const isWebOnly = async () => {
  const options = minimist(getArgv());
  return Boolean(options["web-only"]);
};
const isVersionBeyond17 = (version) => {
  return semver.gte(semver.minVersion(version), "17.0.0");
};
const getReactVersion = (cwd) => {
  const pkgPath = pkgUp.sync({
    cwd
  });
  if (!pkgPath) {
    return false;
  }
  const pkgInfo = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const deps = {
    ...pkgInfo.devDependencies,
    ...pkgInfo.dependencies
  };
  if (typeof deps.react !== "string") {
    return false;
  }
  try {
    const reactPath = require.resolve("react/package.json", {
      paths: [
        cwd
      ]
    });
    const reactVersion = JSON.parse(fs.readFileSync(reactPath, "utf8")).version;
    return reactVersion;
  } catch (error) {
    console.error("Failed to resolve React version:", error);
    return false;
  }
};
const isBeyondReact17 = (cwd) => {
  const reactVersion = getReactVersion(cwd);
  if (!reactVersion) {
    return false;
  }
  return isVersionBeyond17(reactVersion);
};
const isSupportAutomaticJsx = (cwd) => {
  const reactVersion = getReactVersion(cwd);
  if (!reactVersion) {
    return false;
  }
  return semver.satisfies(semver.minVersion(reactVersion), ">=16.14.0");
};
const isReact18 = (cwd = process.cwd()) => {
  const reactVersion = getReactVersion(cwd);
  if (!reactVersion) {
    return false;
  }
  return semver.gte(semver.minVersion(reactVersion), "18.0.0");
};
const isTypescript = (root) => fs.existsSync(path.resolve(root, "./tsconfig.json"));
export {
  getReactVersion,
  isApiOnly,
  isBeyondReact17,
  isDepExists,
  isPackageInstalled,
  isReact18,
  isSupportAutomaticJsx,
  isTypescript,
  isVersionBeyond17,
  isWebOnly
};
