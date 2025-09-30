import { isFunction, isPlainObject } from "./is";
import { logger } from "./logger";
function applyOptionsChain(defaults, options, utils) {
  var mergeFn = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : Object.assign;
  if (!options) {
    return defaults;
  }
  if (isPlainObject(options)) {
    return mergeFn(defaults, options);
  } else if (isFunction(options)) {
    var ret = options(defaults, utils);
    if (ret) {
      if (!isPlainObject(ret)) {
        logger.warn("".concat(options.name, ": Function should mutate the config and return nothing, Or return a cloned or merged version of config object."));
      }
      return ret;
    }
  } else if (Array.isArray(options)) {
    return options.reduce(function(memo, cur) {
      return applyOptionsChain(memo, cur, utils, mergeFn);
    }, defaults);
  } else {
    throw new Error("applyOptionsChain error:\ndefault options is: ".concat(JSON.stringify(defaults)));
  }
  return defaults;
}
export {
  applyOptionsChain
};
