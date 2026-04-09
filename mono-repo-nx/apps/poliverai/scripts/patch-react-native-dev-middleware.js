#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..', '..');
const inspectorProxyPath = path.join(
  repoRoot,
  'node_modules',
  '@react-native',
  'dev-middleware',
  'dist',
  'inspector-proxy',
  'InspectorProxy.js'
);

if (!fs.existsSync(inspectorProxyPath)) {
  console.log('[patch-react-native-dev-middleware] InspectorProxy.js not found, skipping');
  process.exit(0);
}

let source = fs.readFileSync(inspectorProxyPath, 'utf8');

if (source.includes("DevTools requested stale device='%s'; falling back to only connected device='%s'")) {
  console.log('[patch-react-native-dev-middleware] patch already applied');
  process.exit(0);
}

const from = `      const debuggerRelativeBaseUrl =
        (0, _getBaseUrlFromRequest.default)(req) ?? this.#serverBaseUrl;
      const device = deviceId ? this.#devices.get(deviceId) : undefined;
      const debuggerSessionIDs = {
        appId: device?.getApp() || null,
        deviceId,
        deviceName: device?.getName() || null,
        pageId,
      };`;

const to = `      const debuggerRelativeBaseUrl =
        (0, _getBaseUrlFromRequest.default)(req) ?? this.#serverBaseUrl;
      let device = deviceId ? this.#devices.get(deviceId) : undefined;
      let resolvedDeviceId = deviceId;
      if (device == null && deviceId != null && this.#devices.size === 1) {
        const firstConnectedDevice = Array.from(this.#devices.entries())[0];
        if (firstConnectedDevice) {
          resolvedDeviceId = firstConnectedDevice[0];
          device = firstConnectedDevice[1];
          this.#logger?.warn(
            "DevTools requested stale device='%s'; falling back to only connected device='%s' for app='%s'.",
            deviceId,
            resolvedDeviceId,
            device.getApp() || "unknown"
          );
        }
      }
      const debuggerSessionIDs = {
        appId: device?.getApp() || null,
        deviceId: resolvedDeviceId,
        deviceName: device?.getName() || null,
        pageId,
      };`;

if (!source.includes(from)) {
  console.error('[patch-react-native-dev-middleware] expected source block not found');
  process.exit(1);
}

source = source.replace(from, to);
source = source.replace(
  '        if (deviceId == null || pageId == null) {',
  '        if (resolvedDeviceId == null || pageId == null) {'
);

fs.writeFileSync(inspectorProxyPath, source);
console.log('[patch-react-native-dev-middleware] patched InspectorProxy.js');
