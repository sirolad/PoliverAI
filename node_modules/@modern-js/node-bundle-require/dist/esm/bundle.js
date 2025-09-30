import path from "path";
import { fs, CONFIG_CACHE_DIR, createDebugger, nanoid, pkgUp } from "@modern-js/utils";
import { build, context } from "esbuild";
const debug = createDebugger("node-bundle");
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
  const pkgJsonPath = await pkgUp({
    cwd
  });
  if (pkgJsonPath) {
    var _pkgJson_main;
    const pkgJson = await fs.readJSON(pkgJsonPath);
    const ext = path.extname(cwd);
    return pkgJson.type === "module" && ext !== ".cjs" && !((_pkgJson_main = pkgJson.main) === null || _pkgJson_main === void 0 ? void 0 : _pkgJson_main.endsWith(".cjs"));
  }
  return false;
}
const defaultGetOutputFile = async (filepath) => path.resolve(CONFIG_CACHE_DIR, `${filepath.replace(/\.(js|ts)/, "")}.${nanoid(8)}.cjs`);
async function bundle(filepath, options) {
  if (!JS_EXT_RE.test(filepath)) {
    throw new Error(`${filepath} is not a valid JS file`);
  }
  debug("bundle", filepath, options);
  const getOutputFile = (options === null || options === void 0 ? void 0 : options.getOutputFile) || defaultGetOutputFile;
  const outfile = await getOutputFile(path.basename(filepath));
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
            const contents = fs.readFileSync(args.path, "utf-8");
            return {
              contents: contents.replace(/\b__filename\b/g, JSON.stringify(args.path)).replace(/\b__dirname\b/g, JSON.stringify(path.dirname(args.path))).replace(/\bimport\.meta\.url\b/g, JSON.stringify(`file://${args.path}`)),
              loader: inferLoader(path.extname(args.path))
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
    const ctx = await context(esbuildOptions);
    await ctx.rebuild();
    await ctx.watch();
  } else {
    await build(esbuildOptions);
  }
  return outfile;
}
export {
  EXTERNAL_REGEXP,
  bundle,
  defaultGetOutputFile
};
