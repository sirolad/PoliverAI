#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..', '..');
const reactNativeCli = path.join(repoRoot, 'node_modules', 'react-native', 'cli.js');

const forwardedArgs = process.argv.slice(2);

const child = spawn(
  process.execPath,
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
