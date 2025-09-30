import { _ as _object_spread } from "@swc/helpers/_/_object_spread";
import { isPlainObject } from "../is";
var getEntryOptions = function(name, isMainEntry, baseOptions, optionsByEntries, packageName) {
  if (optionsByEntries) {
    var optionsByEntry = getOptionsByEntryName(name, optionsByEntries);
    if (optionsByEntry === void 0 && isMainEntry && packageName) {
      optionsByEntry = getOptionsByEntryName(packageName, optionsByEntries);
    }
    return optionsByEntry !== void 0 ? isPlainObject(optionsByEntry) && isPlainObject(baseOptions) ? _object_spread({}, baseOptions, optionsByEntry) : optionsByEntry : baseOptions;
  } else {
    return baseOptions;
  }
};
var getOptionsByEntryName = function(name, optionsByEntries) {
  return optionsByEntries.hasOwnProperty(name) ? optionsByEntries[name] : void 0;
};
export {
  getEntryOptions
};
