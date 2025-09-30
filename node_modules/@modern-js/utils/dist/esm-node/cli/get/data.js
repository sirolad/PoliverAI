import os from "os";
import path from "path";
import { fs, browserslist, json5 } from "../../compiled";
import { INTERNAL_CLI_PLUGINS } from "../constants";
import { isDepExists } from "../is";
import { canUsePnpm, canUseYarn } from "../package";
const MAX_TIMES = 5;
async function getPackageManager(cwd = process.cwd()) {
  let appDirectory = cwd;
  let times = 0;
  while (os.homedir() !== appDirectory && times < MAX_TIMES) {
    times++;
    if (fs.existsSync(path.resolve(appDirectory, "pnpm-lock.yaml"))) {
      return "pnpm";
    }
    if (fs.existsSync(path.resolve(appDirectory, "yarn.lock"))) {
      return "yarn";
    }
    if (fs.existsSync(path.resolve(appDirectory, "package-lock.json"))) {
      return "npm";
    }
    appDirectory = path.join(appDirectory, "..");
  }
  if (await canUsePnpm()) {
    return "pnpm";
  }
  if (await canUseYarn()) {
    return "yarn";
  }
  return "npm";
}
const getCoreJsVersion = (corejsPkgPath) => {
  try {
    const { version } = fs.readJSONSync(corejsPkgPath);
    const [major, minor] = version.split(".");
    return `${major}.${minor}`;
  } catch (err) {
    return "3";
  }
};
const getAntdMajorVersion = (appDirectory) => {
  try {
    const pkgJsonPath = require.resolve("antd/package.json", {
      paths: [
        appDirectory
      ]
    });
    const { version } = require(pkgJsonPath);
    return Number(version.split(".")[0]);
  } catch (err) {
    return null;
  }
};
const defaults = [
  "> 0.01%",
  "not dead",
  "not op_mini all"
];
const getBrowserslist = (appDirectory) => browserslist.loadConfig({
  path: appDirectory
}) || defaults;
function getInternalPlugins(appDirectory, internalPlugins = INTERNAL_CLI_PLUGINS) {
  return [
    ...Object.keys(internalPlugins).filter((name) => {
      const config = internalPlugins[name];
      if (typeof config !== "string" && config.forced === true) {
        return true;
      }
      return isDepExists(appDirectory, name);
    }).map((name) => {
      const config = internalPlugins[name];
      if (typeof config !== "string") {
        return config.path;
      } else {
        return config;
      }
    })
  ];
}
const readTsConfig = (root) => {
  return readTsConfigByFile(path.resolve(root, "./tsconfig.json"));
};
const readTsConfigByFile = (filename) => {
  const content = fs.readFileSync(path.resolve(filename), "utf-8");
  return json5.parse(content);
};
export {
  defaults,
  getAntdMajorVersion,
  getBrowserslist,
  getCoreJsVersion,
  getInternalPlugins,
  getPackageManager,
  readTsConfig,
  readTsConfigByFile
};
