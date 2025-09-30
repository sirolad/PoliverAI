import { isFunction, isPlainObject } from "./is";
import { logger } from "./logger";
function applyOptionsChain(defaults, options, utils, mergeFn = Object.assign) {
  if (!options) {
    return defaults;
  }
  if (isPlainObject(options)) {
    return mergeFn(defaults, options);
  } else if (isFunction(options)) {
    const ret = options(defaults, utils);
    if (ret) {
      if (!isPlainObject(ret)) {
        logger.warn(`${options.name}: Function should mutate the config and return nothing, Or return a cloned or merged version of config object.`);
      }
      return ret;
    }
  } else if (Array.isArray(options)) {
    return options.reduce((memo, cur) => applyOptionsChain(memo, cur, utils, mergeFn), defaults);
  } else {
    throw new Error(`applyOptionsChain error:
default options is: ${JSON.stringify(defaults)}`);
  }
  return defaults;
}
export {
  applyOptionsChain
};
