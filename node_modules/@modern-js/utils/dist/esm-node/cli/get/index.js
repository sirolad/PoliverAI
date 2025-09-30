import path from "path";
import { CONFIG_FILE_EXTENSIONS } from "../constants";
import { findExists } from "../fs";
const getServerConfig = async (appDirectory, configFile) => {
  const configFilePath = findExists(CONFIG_FILE_EXTENSIONS.map((extension) => path.resolve(appDirectory, `${configFile}${extension}`)));
  return configFilePath;
};
const getMeta = (metaName = "modern-js") => {
  const meta = metaName.toLowerCase().split("-")[0];
  return meta;
};
const getTargetDir = (from, baseDir, targetBaseDir) => {
  const relativePath = path.relative(baseDir, from);
  return path.resolve(targetBaseDir, relativePath);
};
export * from "./data";
export * from "./config";
export {
  getMeta,
  getServerConfig,
  getTargetDir
};
