import { fs, deleteRequireCache } from "@modern-js/utils";
import { bundle, defaultGetOutputFile } from "./bundle";
async function bundleRequire(filepath, options) {
  const configFile = await bundle(filepath, options);
  let mod;
  const req = (options === null || options === void 0 ? void 0 : options.require) || require;
  try {
    mod = await req(configFile);
    deleteRequireCache(configFile);
  } finally {
    if ((options === null || options === void 0 ? void 0 : options.autoClear) === void 0 || options.autoClear) {
      fs.unlinkSync(configFile);
    }
  }
  return mod;
}
export {
  bundle,
  bundleRequire,
  defaultGetOutputFile
};
