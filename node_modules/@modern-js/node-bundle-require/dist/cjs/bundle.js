"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var bundle_exports = {};
__export(bundle_exports, {
  EXTERNAL_REGEXP: () => EXTERNAL_REGEXP,
  bundle: () => bundle,
  defaultGetOutputFile: () => defaultGetOutputFile
});
module.exports = __toCommonJS(bundle_exports);
var import_path = __toESM(require("path"));
var import_utils = require("@modern-js/utils");
var import_esbuild = require("esbuild");
const debug = (0, import_utils.createDebugger)("node-bundle");
const JS_EXT_RE = /\.(mjs|cjs|ts|js|tsx|jsx)$/;
const BUNDLED_EXT_RE = /\.(ts|mts|cts|tsx|mjs)$/;
const EXTERNAL_REGEXP = /^[^./]|^\.[^./]|^\.\.[^/]/;
function inferLoader(ext) {
  if (ext === ".mjs" || ext === ".cjs") {
    return "js";
  }
  return ext.slice(1);
}
async function isTypeModulePkg(cwd) {
  const pkgJsonPath = await (0, import_utils.pkgUp)({
    cwd
  });
  if (pkgJsonPath) {
    var _pkgJson_main;
    const pkgJson = await import_utils.fs.readJSON(pkgJsonPath);
    const ext = import_path.default.extname(cwd);
    return pkgJson.type === "module" && ext !== ".cjs" && !((_pkgJson_main = pkgJson.main) === null || _pkgJson_main === void 0 ? void 0 : _pkgJson_main.endsWith(".cjs"));
  }
  return false;
}
const defaultGetOutputFile = async (filepath) => import_path.default.resolve(import_utils.CONFIG_CACHE_DIR, `${filepath.replace(/\.(js|ts)/, "")}.${(0, import_utils.nanoid)(8)}.cjs`);
async function bundle(filepath, options) {
  if (!JS_EXT_RE.test(filepath)) {
    throw new Error(`${filepath} is not a valid JS file`);
  }
  debug("bundle", filepath, options);
  const getOutputFile = (options === null || options === void 0 ? void 0 : options.getOutputFile) || defaultGetOutputFile;
  const outfile = await getOutputFile(import_path.default.basename(filepath));
  const esbuildOptions = {
    entryPoints: [
      filepath
    ],
    outfile,
    format: "cjs",
    platform: "node",
    bundle: true,
    // fix transforming error when the project's tsconfig.json
    // sets `target: "es5"`
    // reference: https://github.com/evanw/esbuild/releases/tag/v0.12.6
    target: "esnext",
    ...options === null || options === void 0 ? void 0 : options.esbuildOptions,
    plugins: [
      ...(options === null || options === void 0 ? void 0 : options.esbuildPlugins) || [],
      // https://github.com/evanw/esbuild/issues/1051#issuecomment-806325487
      {
        name: "native-node-modules",
        setup(build2) {
          build2.onResolve({
            filter: /\.node$/,
            namespace: "file"
          }, (args) => ({
            path: require.resolve(args.path, {
              paths: [
                args.resolveDir
              ]
            }),
            namespace: "node-file"
          }));
          build2.onLoad({
            filter: /.*/,
            namespace: "node-file"
          }, (args) => ({
            contents: `
              import path from ${JSON.stringify(args.path)}
              try { module.exports = require(path) }
              catch {}
            `
          }));
          build2.onResolve({
            filter: /\.node$/,
            namespace: "node-file"
          }, (args) => ({
            path: args.path,
            namespace: "file"
          }));
          const opts = build2.initialOptions;
          opts.loader = opts.loader || {};
          opts.loader[".node"] = "file";
        }
      },
      {
        name: "replace-path",
        setup(ctx) {
          ctx.onLoad({
            filter: JS_EXT_RE
          }, async (args) => {
            const contents = import_utils.fs.readFileSync(args.path, "utf-8");
            return {
              contents: contents.replace(/\b__filename\b/g, JSON.stringify(args.path)).replace(/\b__dirname\b/g, JSON.stringify(import_path.default.dirname(args.path))).replace(/\bimport\.meta\.url\b/g, JSON.stringify(`file://${args.path}`)),
              loader: inferLoader(import_path.default.extname(args.path))
            };
          });
        }
      },
      // https://github.com/evanw/esbuild/issues/619#issuecomment-751995294
      {
        name: "make-all-packages-external",
        setup(_build) {
          _build.onResolve({
            filter: EXTERNAL_REGEXP
          }, async (args) => {
            let external = true;
            if (args.kind === "entry-point") {
              external = false;
            }
            try {
              const resolvedPath = require.resolve(args.path, {
                paths: [
                  args.resolveDir
                ]
              });
              if (BUNDLED_EXT_RE.test(resolvedPath) || await isTypeModulePkg(resolvedPath)) {
                return {
                  external: false
                };
              }
            } catch (err) {
            }
            return {
              path: args.path,
              external
            };
          });
        }
      }
    ]
  };
  if (options === null || options === void 0 ? void 0 : options.watch) {
    const ctx = await (0, import_esbuild.context)(esbuildOptions);
    await ctx.rebuild();
    await ctx.watch();
  } else {
    await (0, import_esbuild.build)(esbuildOptions);
  }
  return outfile;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EXTERNAL_REGEXP,
  bundle,
  defaultGetOutputFile
});
