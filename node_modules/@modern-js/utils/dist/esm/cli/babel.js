import { _ as _object_spread } from "@swc/helpers/_/_object_spread";
import { _ as _to_consumable_array } from "@swc/helpers/_/_to_consumable_array";
import { isAbsolute, sep } from "path";
import { applyOptionsChain } from "./applyOptionsChain";
import { ensureArray } from "./ensure";
import { normalizeToPosixPath } from "./path";
var formatPath = function(originPath) {
  if (isAbsolute(originPath)) {
    return originPath.split(sep).join("/");
  }
  return originPath;
};
var getPluginItemName = function(item) {
  if (typeof item === "string") {
    return formatPath(item);
  }
  if (Array.isArray(item) && typeof item[0] === "string") {
    return formatPath(item[0]);
  }
  return null;
};
var addPlugins = function(plugins, config) {
  if (config.plugins) {
    var _config_plugins;
    (_config_plugins = config.plugins).push.apply(_config_plugins, _to_consumable_array(plugins));
  } else {
    config.plugins = plugins;
  }
};
var addPresets = function(presets, config) {
  if (config.presets) {
    var _config_presets;
    (_config_presets = config.presets).push.apply(_config_presets, _to_consumable_array(presets));
  } else {
    config.presets = presets;
  }
};
var removePlugins = function(plugins, config) {
  if (!config.plugins) {
    return;
  }
  var removeList = ensureArray(plugins);
  config.plugins = config.plugins.filter(function(item) {
    var name = getPluginItemName(item);
    if (name) {
      return !removeList.find(function(removeItem) {
        return name.includes(removeItem);
      });
    }
    return true;
  });
};
var removePresets = function(presets, config) {
  if (!config.presets) {
    return;
  }
  var removeList = ensureArray(presets);
  config.presets = config.presets.filter(function(item) {
    var name = getPluginItemName(item);
    if (name) {
      return !removeList.find(function(removeItem) {
        return name.includes(removeItem);
      });
    }
    return true;
  });
};
var modifyPresetOptions = function(presetName, options) {
  var presets = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : [];
  presets.forEach(function(preset, index) {
    if (Array.isArray(preset)) {
      if (typeof preset[0] === "string" && normalizeToPosixPath(preset[0]).includes(presetName)) {
        preset[1] = _object_spread({}, preset[1] || {}, options);
      }
    } else if (typeof preset === "string" && normalizeToPosixPath(preset).includes(presetName)) {
      presets[index] = [
        preset,
        options
      ];
    }
  });
};
var getBabelUtils = function(config) {
  var noop = function() {
  };
  return {
    addPlugins: function(plugins) {
      return addPlugins(plugins, config);
    },
    addPresets: function(presets) {
      return addPresets(presets, config);
    },
    removePlugins: function(plugins) {
      return removePlugins(plugins, config);
    },
    removePresets: function(presets) {
      return removePresets(presets, config);
    },
    // `addIncludes` and `addExcludes` are noop functions by default,
    // It can be overridden by `extraBabelUtils`.
    addIncludes: noop,
    addExcludes: noop,
    // Compat `presetEnvOptions` and `presetReactOptions` in Eden.
    modifyPresetEnvOptions: function(options) {
      return modifyPresetOptions("@babel/preset-env", options, config.presets || []);
    },
    modifyPresetReactOptions: function(options) {
      return modifyPresetOptions("@babel/preset-react", options, config.presets || []);
    }
  };
};
var applyUserBabelConfig = function(defaultOptions, userBabelConfig, extraBabelUtils) {
  if (userBabelConfig) {
    var babelUtils = _object_spread({}, getBabelUtils(defaultOptions), extraBabelUtils);
    return applyOptionsChain(defaultOptions, userBabelConfig || {}, babelUtils);
  }
  return defaultOptions;
};
export {
  applyUserBabelConfig,
  getBabelUtils
};
