#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..', '..');
const reactNativeCli = path.join(repoRoot, 'node_modules', 'react-native', 'cli.js');

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
const forwardedArgs = process.argv.slice(2);

const child = spawn(
  metroNodeBinary,
  [reactNativeCli, 'start', '--config', 'metro.config.js', ...forwardedArgs],
  {
    cwd: appRoot,
    env: process.env,
    shell: false,
    stdio: 'inherit',
  }
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
