import { isIPv6 } from "net";
import os from "os";
import { chalk } from "../compiled";
import { DEFAULT_DEV_HOST } from "./constants";
import { isDev, isSingleEntry } from "./is";
const normalizeUrl = (url) => url.replace(/([^:]\/)\/+/g, "$1");
const getIpv4Interfaces = () => {
  const interfaces = os.networkInterfaces();
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
  if (isIPv6(host)) {
    return host === "::" ? "[::1]" : `[${host}]`;
  }
  return host;
};
const getAddressUrls = (protocol = "http", port, host) => {
  const LOCAL_LABEL = "Local:  ";
  const NETWORK_LABEL = "Network:  ";
  const isLocalhost = (url) => url === null || url === void 0 ? void 0 : url.includes("localhost");
  if (host && host !== DEFAULT_DEV_HOST) {
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
  const isHttps = isDev() && ((config === null || config === void 0 ? void 0 : (_config_dev = config.dev) === null || _config_dev === void 0 ? void 0 : _config_dev.https) || (config === null || config === void 0 ? void 0 : (_config_tools = config.tools) === null || _config_tools === void 0 ? void 0 : (_config_tools_devServer = _config_tools.devServer) === null || _config_tools_devServer === void 0 ? void 0 : _config_tools_devServer.https));
  const urls = getAddressUrls(isHttps ? "https" : "http", port, (_config_dev1 = config.dev) === null || _config_dev1 === void 0 ? void 0 : _config_dev1.host);
  const routes = !apiOnly ? serverRoutes.filter((route) => route.entryName) : serverRoutes;
  let message = "\n";
  if (isSingleEntry(entrypoints, (_config_source = config.source) === null || _config_source === void 0 ? void 0 : _config_source.mainEntryName) || apiOnly) {
    message += urls.map(({ label, url }) => `  ${chalk.bold(`> ${label.padEnd(10)}`)}${chalk.cyanBright(normalizeUrl(`${url}/${routes[0].urlPath}`))}
`).join("");
  } else {
    const maxNameLength = Math.max(...routes.map((r) => r.entryName.length));
    urls.forEach(({ label, url }) => {
      message += `  ${chalk.bold(`> ${label}`)}${routes.length === 0 ? chalk.cyanBright(url) : ""}
`;
      routes.forEach(({ entryName, urlPath, isSSR }) => {
        if (!checkedEntries.includes(entryName)) {
          return;
        }
        message += `    ${chalk.yellowBright(isSSR ? "λ" : "○")}  ${chalk.yellowBright(entryName.padEnd(maxNameLength + 8))}${chalk.cyanBright(normalizeUrl(`${url}/${urlPath}`))}
`;
      });
    });
    message += "\n";
    message += chalk.cyanBright("  λ (Server) server-side renders at runtime\n");
    message += chalk.cyanBright("  ○ (Static) client-side renders as static HTML\n");
  }
  if ((_config_dev2 = config.dev) === null || _config_dev2 === void 0 ? void 0 : _config_dev2.cliShortcuts) {
    message += `  ${chalk.dim("> press")} ${chalk.bold("h + enter")} ${chalk.dim("to show shortcuts")}
`;
  }
  return message;
};
export {
  getAddressUrls,
  prettyInstructions
};
