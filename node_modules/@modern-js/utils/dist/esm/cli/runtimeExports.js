import { _ as _to_consumable_array } from "@swc/helpers/_/_to_consumable_array";
import path from "path";
import { fs } from "../compiled";
import { normalizeOutputPath } from "./path";
var memo = function(fn) {
  var cache = /* @__PURE__ */ new Map();
  return function() {
    for (var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++) {
      params[_key] = arguments[_key];
    }
    var stringifiedParams = JSON.stringify(params);
    var cachedResult = cache.get(stringifiedParams);
    if (cachedResult) {
      return cachedResult;
    }
    var res = fn.apply(void 0, _to_consumable_array(params));
    cache.set(stringifiedParams, res);
    return res;
  };
};
var createRuntimeExportsUtils = memo(function() {
  var pwd = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "", namespace = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "index";
  var entryExportFile = path.join(pwd, ".runtime-exports/".concat(namespace, ".js"));
  var addExport = function(statement) {
    var statementStr = normalizeOutputPath(statement);
    try {
      fs.ensureFileSync(entryExportFile);
      if (!fs.readFileSync(entryExportFile, "utf8").includes(statementStr)) {
        fs.appendFileSync(entryExportFile, "".concat(statementStr, "\n"));
      }
    } catch (e) {
    }
  };
  var getPath = function() {
    return entryExportFile;
  };
  return {
    addExport,
    getPath
  };
});
export {
  createRuntimeExportsUtils
};
