import { _ as _to_consumable_array } from "@swc/helpers/_/_to_consumable_array";
import { isIPv6 } from "net";
import os from "os";
import { chalk } from "../compiled";
import { DEFAULT_DEV_HOST } from "./constants";
import { isDev, isSingleEntry } from "./is";
var normalizeUrl = function(url) {
  return url.replace(/([^:]\/)\/+/g, "$1");
};
var getIpv4Interfaces = function() {
  var interfaces = os.networkInterfaces();
  var ipv4Interfaces = [];
  Object.keys(interfaces).forEach(function(key) {
    interfaces[key].forEach(function(detail) {
      var familyV4Value = typeof detail.family === "string" ? "IPv4" : 4;
      if (detail.family === familyV4Value) {
        ipv4Interfaces.push(detail);
      }
    });
  });
  return ipv4Interfaces;
};
var getHostInUrl = function(host) {
  if (isIPv6(host)) {
    return host === "::" ? "[::1]" : "[".concat(host, "]");
  }
  return host;
};
var getAddressUrls = function() {
  var protocol = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "http", port = arguments.length > 1 ? arguments[1] : void 0, host = arguments.length > 2 ? arguments[2] : void 0;
  var LOCAL_LABEL = "Local:  ";
  var NETWORK_LABEL = "Network:  ";
  var isLocalhost = function(url) {
    return url === null || url === void 0 ? void 0 : url.includes("localhost");
  };
  if (host && host !== DEFAULT_DEV_HOST) {
    return [
      {
        label: isLocalhost(host) ? LOCAL_LABEL : NETWORK_LABEL,
        url: "".concat(protocol, "://").concat(getHostInUrl(host), ":").concat(port)
      }
    ];
  }
  var ipv4Interfaces = getIpv4Interfaces();
  return ipv4Interfaces.reduce(function(memo, detail) {
    if (isLocalhost(detail.address) || detail.internal) {
      memo.push({
        label: LOCAL_LABEL,
        url: "".concat(protocol, "://localhost:").concat(port)
      });
    } else {
      memo.push({
        label: NETWORK_LABEL,
        url: "".concat(protocol, "://").concat(detail.address, ":").concat(port)
      });
    }
    return memo;
  }, []);
};
var prettyInstructions = function(appContext, config) {
  var _config_dev, _config_tools_devServer, _config_tools, _config_dev1, _config_source, _config_dev2;
  var entrypoints = appContext.entrypoints, serverRoutes = appContext.serverRoutes, port = appContext.port, apiOnly = appContext.apiOnly, checkedEntries = appContext.checkedEntries;
  var isHttps = isDev() && ((config === null || config === void 0 ? void 0 : (_config_dev = config.dev) === null || _config_dev === void 0 ? void 0 : _config_dev.https) || (config === null || config === void 0 ? void 0 : (_config_tools = config.tools) === null || _config_tools === void 0 ? void 0 : (_config_tools_devServer = _config_tools.devServer) === null || _config_tools_devServer === void 0 ? void 0 : _config_tools_devServer.https));
  var urls = getAddressUrls(isHttps ? "https" : "http", port, (_config_dev1 = config.dev) === null || _config_dev1 === void 0 ? void 0 : _config_dev1.host);
  var routes = !apiOnly ? serverRoutes.filter(function(route) {
    return route.entryName;
  }) : serverRoutes;
  var message = "\n";
  if (isSingleEntry(entrypoints, (_config_source = config.source) === null || _config_source === void 0 ? void 0 : _config_source.mainEntryName) || apiOnly) {
    message += urls.map(function(param) {
      var label = param.label, url = param.url;
      return "  ".concat(chalk.bold("> ".concat(label.padEnd(10)))).concat(chalk.cyanBright(normalizeUrl("".concat(url, "/").concat(routes[0].urlPath))), "\n");
    }).join("");
  } else {
    var _Math;
    var maxNameLength = (_Math = Math).max.apply(_Math, _to_consumable_array(routes.map(function(r) {
      return r.entryName.length;
    })));
    urls.forEach(function(param) {
      var label = param.label, url = param.url;
      message += "  ".concat(chalk.bold("> ".concat(label))).concat(routes.length === 0 ? chalk.cyanBright(url) : "", "\n");
      routes.forEach(function(param2) {
        var entryName = param2.entryName, urlPath = param2.urlPath, isSSR = param2.isSSR;
        if (!checkedEntries.includes(entryName)) {
          return;
        }
        message += "    ".concat(chalk.yellowBright(isSSR ? "λ" : "○"), "  ").concat(chalk.yellowBright(entryName.padEnd(maxNameLength + 8))).concat(chalk.cyanBright(normalizeUrl("".concat(url, "/").concat(urlPath))), "\n");
      });
    });
    message += "\n";
    message += chalk.cyanBright("  λ (Server) server-side renders at runtime\n");
    message += chalk.cyanBright("  ○ (Static) client-side renders as static HTML\n");
  }
  if ((_config_dev2 = config.dev) === null || _config_dev2 === void 0 ? void 0 : _config_dev2.cliShortcuts) {
    message += "  ".concat(chalk.dim("> press"), " ").concat(chalk.bold("h + enter"), " ").concat(chalk.dim("to show shortcuts"), "\n");
  }
  return message;
};
export {
  getAddressUrls,
  prettyInstructions
};
