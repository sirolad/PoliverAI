import path from "path";
import { fs } from "../compiled";
import { normalizeOutputPath } from "./path";
const memo = (fn) => {
  const cache = /* @__PURE__ */ new Map();
  return (...params) => {
    const stringifiedParams = JSON.stringify(params);
    const cachedResult = cache.get(stringifiedParams);
    if (cachedResult) {
      return cachedResult;
    }
    const res = fn(...params);
    cache.set(stringifiedParams, res);
    return res;
  };
};
const createRuntimeExportsUtils = memo((pwd = "", namespace = "index") => {
  const entryExportFile = path.join(pwd, `.runtime-exports/${namespace}.js`);
  const addExport = (statement) => {
    const statementStr = normalizeOutputPath(statement);
    try {
      fs.ensureFileSync(entryExportFile);
      if (!fs.readFileSync(entryExportFile, "utf8").includes(statementStr)) {
        fs.appendFileSync(entryExportFile, `${statementStr}
`);
      }
    } catch {
    }
  };
  const getPath = () => entryExportFile;
  return {
    addExport,
    getPath
  };
});
export {
  createRuntimeExportsUtils
};
