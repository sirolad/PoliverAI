#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { ensureAppHoistedLinks } = require('../../../scripts/ensure-app-hoisted-links');

const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..', '..');
const metroPort = Number(process.env.RCT_METRO_PORT || 8081);
const metroHost = 'localhost';
const reactNativeCli = path.join(repoRoot, 'node_modules', 'react-native-macos', 'cli.js');
const reactNativeMetroCli = path.join(repoRoot, 'node_modules', 'react-native', 'cli.js');
let startedMetroProcess = null;

function supportsStyleText(nodeBinary) {
  if (!nodeBinary || !fs.existsSync(nodeBinary)) {
    return false;
  }

  const result = spawnSync(
    nodeBinary,
    ['-p', "typeof require('node:util').styleText"],
    {
      encoding: 'utf8',
    }
  );

  return result.status === 0 && result.stdout.trim() === 'function';
}

function resolveNodeBinary() {
  const home = process.env.HOME || '';
  const candidates = [
    process.execPath,
    path.join(home, '.nvm', 'versions', 'node', 'v20.20.1', 'bin', 'node'),
    path.join(home, '.nvm', 'versions', 'node', 'v20.19.4', 'bin', 'node'),
    path.join(home, '.nvm', 'versions', 'node', 'v20.19.1', 'bin', 'node'),
  ];

  for (const candidate of candidates) {
    if (supportsStyleText(candidate)) {
      return candidate;
    }
  }

  return process.execPath;
}

const metroNodeBinary = resolveNodeBinary();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isMetroRunning() {
  return new Promise((resolve) => {
    const request = http.get(
      {
        host: metroHost,
        port: metroPort,
        path: '/status',
        timeout: 1500,
      },
      (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          resolve(body.trim() === 'packager-status:running');
        });
      }
    );

    request.on('error', () => resolve(false));
    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function ensureMetroRunning() {
  if (await isMetroRunning()) {
    console.log(`run-macos-with-metro: Metro already running on ${metroPort}`);
    return;
  }

  console.log(`run-macos-with-metro: starting Metro on ${metroPort}`);

  const metroProcess = spawn(
    metroNodeBinary,
    [
      reactNativeMetroCli,
      'start',
      '--port',
      String(metroPort),
      '--config',
      'metro.config.js',
    ],
    {
      cwd: appRoot,
      env: {
        ...process.env,
        RCT_METRO_PORT: String(metroPort),
      },
      shell: false,
      stdio: 'inherit',
    }
  );

  startedMetroProcess = metroProcess;

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await isMetroRunning()) {
      console.log(`run-macos-with-metro: Metro is ready on ${metroPort}`);
      return;
    }
    await wait(1000);
  }

  throw new Error(`Metro did not start on port ${metroPort} within 30 seconds.`);
}

function stopStartedMetro() {
  if (startedMetroProcess == null || startedMetroProcess.killed) {
    return;
  }

  startedMetroProcess.kill('SIGINT');
  startedMetroProcess = null;
}

function runMacOS() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      metroNodeBinary,
      [reactNativeCli, 'run-macos', '--no-packager', '--port', String(metroPort)],
      {
        cwd: appRoot,
        env: {
          ...process.env,
          RCT_METRO_PORT: String(metroPort),
        },
        shell: false,
        stdio: 'inherit',
      }
    );

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`react-native run-macos exited with code ${code}`));
    });
  });
}

async function main() {
  console.log(`run-macos-with-metro: using Node ${metroNodeBinary} for Metro`);
  ensureAppHoistedLinks({
    repoRoot,
    appRoot,
    logPrefix: 'run-macos-with-metro',
  });
  await ensureMetroRunning();
  await runMacOS();
}

process.on('SIGINT', () => {
  stopStartedMetro();
  process.exit(130);
});

process.on('SIGTERM', () => {
  stopStartedMetro();
  process.exit(143);
});

main().catch((error) => {
  stopStartedMetro();
  console.error(error.message);
  process.exit(1);
});
