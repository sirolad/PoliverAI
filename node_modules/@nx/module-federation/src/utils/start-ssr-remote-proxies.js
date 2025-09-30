"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSsrRemoteProxies = startSsrRemoteProxies;
const devkit_1 = require("@nx/devkit");
const fs_1 = require("fs");
function startSsrRemoteProxies(staticRemotesConfig, mappedLocationsOfRemotes, sslOptions) {
    const { createProxyMiddleware } = require('http-proxy-middleware');
    const express = require('express');
    let sslCert;
    let sslKey;
    if (sslOptions && sslOptions.pathToCert && sslOptions.pathToKey) {
        if ((0, fs_1.existsSync)(sslOptions.pathToCert) && (0, fs_1.existsSync)(sslOptions.pathToKey)) {
            sslCert = (0, fs_1.readFileSync)(sslOptions.pathToCert);
            sslKey = (0, fs_1.readFileSync)(sslOptions.pathToKey);
        }
        else {
            devkit_1.logger.warn(`Encountered SSL options in project.json, however, the certificate files do not exist in the filesystem. Using http.`);
            devkit_1.logger.warn(`Attempted to find '${sslOptions.pathToCert}' and '${sslOptions.pathToKey}'.`);
        }
    }
    const http = require('http');
    const https = require('https');
    devkit_1.logger.info(`NX Starting static remotes proxies...`);
    for (const app of staticRemotesConfig.remotes) {
        const expressProxy = express();
        /**
         * SSR remotes have two output paths: one for the browser and one for the server.
         * We need to handle paths for both of them.
         * The browser output path is used to serve the client-side code.
         * The server output path is used to serve the server-side code.
         */
        expressProxy.use(createProxyMiddleware({
            target: `${mappedLocationsOfRemotes[app]}`,
            secure: sslCert ? false : undefined,
            changeOrigin: true,
            pathRewrite: (path) => {
                if (path.includes('/server')) {
                    return path;
                }
                else {
                    return `browser/${path}`;
                }
            },
        }));
        const proxyServer = (sslCert ? https : http)
            .createServer({ cert: sslCert, key: sslKey }, expressProxy)
            .listen(staticRemotesConfig.config[app].port);
        process.on('SIGTERM', () => proxyServer.close());
        process.on('exit', () => proxyServer.close());
    }
    devkit_1.logger.info(`Nx SSR Static remotes proxies started successfully`);
}
