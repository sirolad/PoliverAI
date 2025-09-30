import { isAbsolute, sep } from "path";
import { applyOptionsChain } from "./applyOptionsChain";
import { ensureArray } from "./ensure";
import { normalizeToPosixPath } from "./path";
const formatPath = (originPath) => {
  if (isAbsolute(originPath)) {
    return originPath.split(sep).join("/");
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
  const removeList = ensureArray(plugins);
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
  const removeList = ensureArray(presets);
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
      if (typeof preset[0] === "string" && normalizeToPosixPath(preset[0]).includes(presetName)) {
        preset[1] = {
          ...preset[1] || {},
          ...options
        };
      }
    } else if (typeof preset === "string" && normalizeToPosixPath(preset).includes(presetName)) {
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
    return applyOptionsChain(defaultOptions, userBabelConfig || {}, babelUtils);
  }
  return defaultOptions;
};
export {
  applyUserBabelConfig,
  getBabelUtils
};
