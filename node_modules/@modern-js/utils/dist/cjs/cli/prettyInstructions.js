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
var prettyInstructions_exports = {};
__export(prettyInstructions_exports, {
  getAddressUrls: () => getAddressUrls,
  prettyInstructions: () => prettyInstructions
});
module.exports = __toCommonJS(prettyInstructions_exports);
var import_net = require("net");
var import_os = __toESM(require("os"));
var import_compiled = require("../compiled");
var import_constants = require("./constants");
var import_is = require("./is");
const normalizeUrl = (url) => url.replace(/([^:]\/)\/+/g, "$1");
const getIpv4Interfaces = () => {
  const interfaces = import_os.default.networkInterfaces();
  const ipv4Interfaces = [];
  Object.keys(interfaces).forEach((key) => {
    interfaces[key].forEach((detail) => {
      const familyV4Value = typeof detail.family === "string" ? "IPv4" : 4;
      if (detail.family === familyV4Value) {
        ipv4Interfaces.push(detail);
      }
    });
  });
  return ipv4Interfaces;
};
const getHostInUrl = (host) => {
  if ((0, import_net.isIPv6)(host)) {
    return host === "::" ? "[::1]" : `[${host}]`;
  }
  return host;
};
const getAddressUrls = (protocol = "http", port, host) => {
  const LOCAL_LABEL = "Local:  ";
  const NETWORK_LABEL = "Network:  ";
  const isLocalhost = (url) => url === null || url === void 0 ? void 0 : url.includes("localhost");
  if (host && host !== import_constants.DEFAULT_DEV_HOST) {
    return [
      {
        label: isLocalhost(host) ? LOCAL_LABEL : NETWORK_LABEL,
        url: `${protocol}://${getHostInUrl(host)}:${port}`
      }
    ];
  }
  const ipv4Interfaces = getIpv4Interfaces();
  return ipv4Interfaces.reduce((memo, detail) => {
    if (isLocalhost(detail.address) || detail.internal) {
      memo.push({
        label: LOCAL_LABEL,
        url: `${protocol}://localhost:${port}`
      });
    } else {
      memo.push({
        label: NETWORK_LABEL,
        url: `${protocol}://${detail.address}:${port}`
      });
    }
    return memo;
  }, []);
};
const prettyInstructions = (appContext, config) => {
  var _config_dev, _config_tools_devServer, _config_tools, _config_dev1, _config_source, _config_dev2;
  const { entrypoints, serverRoutes, port, apiOnly, checkedEntries } = appContext;
  const isHttps = (0, import_is.isDev)() && ((config === null || config === void 0 ? void 0 : (_config_dev = config.dev) === null || _config_dev === void 0 ? void 0 : _config_dev.https) || (config === null || config === void 0 ? void 0 : (_config_tools = config.tools) === null || _config_tools === void 0 ? void 0 : (_config_tools_devServer = _config_tools.devServer) === null || _config_tools_devServer === void 0 ? void 0 : _config_tools_devServer.https));
  const urls = getAddressUrls(isHttps ? "https" : "http", port, (_config_dev1 = config.dev) === null || _config_dev1 === void 0 ? void 0 : _config_dev1.host);
  const routes = !apiOnly ? serverRoutes.filter((route) => route.entryName) : serverRoutes;
  let message = "\n";
  if ((0, import_is.isSingleEntry)(entrypoints, (_config_source = config.source) === null || _config_source === void 0 ? void 0 : _config_source.mainEntryName) || apiOnly) {
    message += urls.map(({ label, url }) => `  ${import_compiled.chalk.bold(`> ${label.padEnd(10)}`)}${import_compiled.chalk.cyanBright(normalizeUrl(`${url}/${routes[0].urlPath}`))}
`).join("");
  } else {
    const maxNameLength = Math.max(...routes.map((r) => r.entryName.length));
    urls.forEach(({ label, url }) => {
      message += `  ${import_compiled.chalk.bold(`> ${label}`)}${routes.length === 0 ? import_compiled.chalk.cyanBright(url) : ""}
`;
      routes.forEach(({ entryName, urlPath, isSSR }) => {
        if (!checkedEntries.includes(entryName)) {
          return;
        }
        message += `    ${import_compiled.chalk.yellowBright(isSSR ? "λ" : "○")}  ${import_compiled.chalk.yellowBright(entryName.padEnd(maxNameLength + 8))}${import_compiled.chalk.cyanBright(normalizeUrl(`${url}/${urlPath}`))}
`;
      });
    });
    message += "\n";
    message += import_compiled.chalk.cyanBright("  λ (Server) server-side renders at runtime\n");
    message += import_compiled.chalk.cyanBright("  ○ (Static) client-side renders as static HTML\n");
  }
  if ((_config_dev2 = config.dev) === null || _config_dev2 === void 0 ? void 0 : _config_dev2.cliShortcuts) {
    message += `  ${import_compiled.chalk.dim("> press")} ${import_compiled.chalk.bold("h + enter")} ${import_compiled.chalk.dim("to show shortcuts")}
`;
  }
  return message;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAddressUrls,
  prettyInstructions
});
