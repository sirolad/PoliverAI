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
var compiled_exports = {};
__export(compiled_exports, {
  Command: () => import_commander.Command,
  Signale: () => import_signale2.Signale,
  address: () => import_address.default,
  browserslist: () => import_browserslist.default,
  chalk: () => import_chalk.default,
  chokidar: () => chokidar,
  debug: () => import_debug.default,
  dotenv: () => import_dotenv.default,
  dotenvExpand: () => import_dotenv_expand.default,
  execa: () => import_execa.default,
  fastGlob: () => import_fast_glob.default,
  filesize: () => import_filesize.default,
  fs: () => import_fs_extra.default,
  glob: () => import_glob.default,
  globby: () => import_globby.default,
  gzipSize: () => import_gzip_size.default,
  inquirer: () => inquirer,
  json5: () => import_json5.default,
  lodash: () => import_lodash.default,
  mime: () => mime,
  minimist: () => import_minimist.default,
  nanoid: () => import_nanoid.nanoid,
  ora: () => import_ora.default,
  pkgUp: () => import_pkg_up.default,
  program: () => import_commander.program,
  semver: () => import_semver.default,
  signale: () => import_signale.default,
  slash: () => import_slash.default,
  stripAnsi: () => import_strip_ansi.default,
  upath: () => import_upath.default,
  urlJoin: () => import_url_join.default,
  yaml: () => import_js_yaml.default
});
module.exports = __toCommonJS(compiled_exports);
var import_import = require("./import");
var import_fs_extra = __toESM(require("../compiled/fs-extra"));
var import_ora = __toESM(require("../compiled/ora"));
var import_glob = __toESM(require("../compiled/glob"));
var import_js_yaml = __toESM(require("../compiled/js-yaml"));
var import_chalk = __toESM(require("../compiled/chalk"));
var import_debug = __toESM(require("../compiled/debug"));
var import_slash = __toESM(require("../compiled/slash"));
var import_execa = __toESM(require("../compiled/execa"));
var import_json5 = __toESM(require("../compiled/json5"));
var import_upath = __toESM(require("../compiled/upath"));
var import_pkg_up = __toESM(require("../compiled/pkg-up"));
var import_nanoid = require("../compiled/nanoid");
var import_semver = __toESM(require("../compiled/semver"));
var import_dotenv = __toESM(require("../compiled/dotenv"));
var import_lodash = __toESM(require("../compiled/lodash"));
var import_globby = __toESM(require("../compiled/globby"));
var import_address = __toESM(require("../compiled/address"));
var import_signale = __toESM(require("../compiled/signale"));
var import_url_join = __toESM(require("../compiled/url-join"));
var import_minimist = __toESM(require("../compiled/minimist"));
var import_fast_glob = __toESM(require("../compiled/fast-glob"));
var import_filesize = __toESM(require("../compiled/filesize"));
var import_gzip_size = __toESM(require("../compiled/gzip-size"));
var import_strip_ansi = __toESM(require("../compiled/strip-ansi"));
var import_dotenv_expand = __toESM(require("../compiled/dotenv-expand"));
var import_browserslist = __toESM(require("../compiled/browserslist"));
var import_commander = require("../compiled/commander");
var import_signale2 = require("../compiled/signale");
const mime = import_import.Import.lazy("../compiled/mime-types", require);
const chokidar = import_import.Import.lazy("../compiled/chokidar", require);
const inquirer = import_import.Import.lazy("../compiled/inquirer", require);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Command,
  Signale,
  address,
  browserslist,
  chalk,
  chokidar,
  debug,
  dotenv,
  dotenvExpand,
  execa,
  fastGlob,
  filesize,
  fs,
  glob,
  globby,
  gzipSize,
  inquirer,
  json5,
  lodash,
  mime,
  minimist,
  nanoid,
  ora,
  pkgUp,
  program,
  semver,
  signale,
  slash,
  stripAnsi,
  upath,
  urlJoin,
  yaml
});
