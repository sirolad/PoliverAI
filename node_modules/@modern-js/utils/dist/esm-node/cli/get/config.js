import { isPlainObject } from "../is";
const getEntryOptions = (name, isMainEntry, baseOptions, optionsByEntries, packageName) => {
  if (optionsByEntries) {
    let optionsByEntry = getOptionsByEntryName(name, optionsByEntries);
    if (optionsByEntry === void 0 && isMainEntry && packageName) {
      optionsByEntry = getOptionsByEntryName(packageName, optionsByEntries);
    }
    return optionsByEntry !== void 0 ? isPlainObject(optionsByEntry) && isPlainObject(baseOptions) ? {
      ...baseOptions,
      ...optionsByEntry
    } : optionsByEntry : baseOptions;
  } else {
    return baseOptions;
  }
};
const getOptionsByEntryName = (name, optionsByEntries) => optionsByEntries.hasOwnProperty(name) ? optionsByEntries[name] : void 0;
export {
  getEntryOptions
};
