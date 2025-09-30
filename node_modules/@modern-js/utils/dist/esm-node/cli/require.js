const import_meta = {};
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { findExists } from "./fs";
async function compatibleRequire(path, interop = true) {
  if (path.endsWith(".json")) {
    return require(path);
  }
  let requiredModule;
  try {
    requiredModule = require(path);
  } catch (err) {
    if (err.code === "ERR_REQUIRE_ESM") {
      const modulePath = isAbsolute(path) ? pathToFileURL(path).href : path;
      if (process.env.NODE_ENV === "development") {
        const timestamp = Date.now();
        requiredModule = await import(`${modulePath}?t=${timestamp}`);
      } else {
        requiredModule = await import(modulePath);
      }
      return interop ? requiredModule.default : requiredModule;
    } else {
      throw err;
    }
  }
  return interop && (requiredModule === null || requiredModule === void 0 ? void 0 : requiredModule.__esModule) ? requiredModule.default : requiredModule;
}
async function loadFromProject(moduleName, appDir) {
  let requiredModule;
  const paths = [
    appDir,
    process.cwd()
  ];
  try {
    if (typeof require !== "undefined") {
      const modulePath = require.resolve(moduleName, {
        paths
      });
      requiredModule = require(modulePath);
    } else {
      const { createRequire } = await import("node:module");
      const require1 = createRequire(import_meta.url);
      const modulePath = require1.resolve(moduleName, {
        paths
      });
      const moduleUrl = pathToFileURL(modulePath).href;
      requiredModule = await import(moduleUrl);
    }
    return requiredModule.default || requiredModule;
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND") {
      throw new Error(`Cannot find module ${moduleName}.`);
    }
    throw error;
  }
}
const dynamicImport = new Function("modulePath", "return import(modulePath)");
const requireExistModule = async (filename, opt) => {
  const final = {
    extensions: [
      ".ts",
      ".js"
    ],
    interop: true,
    ...opt
  };
  const exist = findExists(final.extensions.map((ext) => `${filename}${ext}`));
  if (!exist) {
    return null;
  }
  return compatibleRequire(exist, final.interop);
};
const cleanRequireCache = (filelist) => {
  filelist.forEach((filepath) => {
    delete require.cache[filepath];
  });
};
function deleteRequireCache(path) {
  if (require.cache[path]) {
    delete require.cache[path];
  }
  if (module.children) {
    module.children = module.children.filter((item) => item.filename !== path);
  }
}
const tryResolve = (name, resolvePath) => {
  let filePath = "";
  try {
    filePath = require.resolve(name, {
      paths: [
        resolvePath
      ]
    });
    delete require.cache[filePath];
  } catch (err) {
    if (err.code === "MODULE_NOT_FOUND") {
      throw new Error(`Can not find module ${name}.`);
    }
    throw err;
  }
  return filePath;
};
export {
  cleanRequireCache,
  compatibleRequire,
  deleteRequireCache,
  dynamicImport,
  loadFromProject,
  requireExistModule,
  tryResolve
};
