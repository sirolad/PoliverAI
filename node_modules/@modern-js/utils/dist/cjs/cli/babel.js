"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var babel_exports = {};
__export(babel_exports, {
  applyUserBabelConfig: () => applyUserBabelConfig,
  getBabelUtils: () => getBabelUtils
});
module.exports = __toCommonJS(babel_exports);
var import_path = require("path");
var import_applyOptionsChain = require("./applyOptionsChain");
var import_ensure = require("./ensure");
var import_path2 = require("./path");
const formatPath = (originPath) => {
  if ((0, import_path.isAbsolute)(originPath)) {
    return originPath.split(import_path.sep).join("/");
  }
  return originPath;
};
const getPluginItemName = (item) => {
  if (typeof item === "string") {
    return formatPath(item);
  }
  if (Array.isArray(item) && typeof item[0] === "string") {
    return formatPath(item[0]);
  }
  return null;
};
const addPlugins = (plugins, config) => {
  if (config.plugins) {
    config.plugins.push(...plugins);
  } else {
    config.plugins = plugins;
  }
};
const addPresets = (presets, config) => {
  if (config.presets) {
    config.presets.push(...presets);
  } else {
    config.presets = presets;
  }
};
const removePlugins = (plugins, config) => {
  if (!config.plugins) {
    return;
  }
  const removeList = (0, import_ensure.ensureArray)(plugins);
  config.plugins = config.plugins.filter((item) => {
    const name = getPluginItemName(item);
    if (name) {
      return !removeList.find((removeItem) => name.includes(removeItem));
    }
    return true;
  });
};
const removePresets = (presets, config) => {
  if (!config.presets) {
    return;
  }
  const removeList = (0, import_ensure.ensureArray)(presets);
  config.presets = config.presets.filter((item) => {
    const name = getPluginItemName(item);
    if (name) {
      return !removeList.find((removeItem) => name.includes(removeItem));
    }
    return true;
  });
};
const modifyPresetOptions = (presetName, options, presets = []) => {
  presets.forEach((preset, index) => {
    if (Array.isArray(preset)) {
      if (typeof preset[0] === "string" && (0, import_path2.normalizeToPosixPath)(preset[0]).includes(presetName)) {
        preset[1] = {
          ...preset[1] || {},
          ...options
        };
      }
    } else if (typeof preset === "string" && (0, import_path2.normalizeToPosixPath)(preset).includes(presetName)) {
      presets[index] = [
        preset,
        options
      ];
    }
  });
};
const getBabelUtils = (config) => {
  const noop = () => {
  };
  return {
    addPlugins: (plugins) => addPlugins(plugins, config),
    addPresets: (presets) => addPresets(presets, config),
    removePlugins: (plugins) => removePlugins(plugins, config),
    removePresets: (presets) => removePresets(presets, config),
    // `addIncludes` and `addExcludes` are noop functions by default,
    // It can be overridden by `extraBabelUtils`.
    addIncludes: noop,
    addExcludes: noop,
    // Compat `presetEnvOptions` and `presetReactOptions` in Eden.
    modifyPresetEnvOptions: (options) => modifyPresetOptions("@babel/preset-env", options, config.presets || []),
    modifyPresetReactOptions: (options) => modifyPresetOptions("@babel/preset-react", options, config.presets || [])
  };
};
const applyUserBabelConfig = (defaultOptions, userBabelConfig, extraBabelUtils) => {
  if (userBabelConfig) {
    const babelUtils = {
      ...getBabelUtils(defaultOptions),
      ...extraBabelUtils
    };
    return (0, import_applyOptionsChain.applyOptionsChain)(defaultOptions, userBabelConfig || {}, babelUtils);
  }
  return defaultOptions;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  applyUserBabelConfig,
  getBabelUtils
});
