#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const appRoot = path.resolve(__dirname, '..');
const marker = path.join(appRoot, '.patches_applied');

if (process.env.SKIP_POSTINSTALL_PATCH === '1') {
  console.log('postinstall-apply-patches: SKIP_POSTINSTALL_PATCH=1; skipping');
  process.exit(0);
}

if (fs.existsSync(marker)) {
  console.log('postinstall-apply-patches: patches already applied; skipping');
  process.exit(0);
}

function run(cmd, args, opts = {}) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  if (r.status !== 0) {
    console.error(`${cmd} ${args.join(' ')} failed with code ${r.status}`);
    process.exit(r.status || 1);
  }
}

// Run app-level postinstall steps and repo-level apply patch
const restore = path.join(appRoot, 'scripts', 'restore-codegen-stubs.js');
const patch = path.join(appRoot, 'scripts', 'patch-react-native-worklets.js');
const applyRepo = path.join(appRoot, '..', '..', 'scripts', 'apply-react-native-worklets-patch.js');

if (fs.existsSync(restore)) run('node', [restore], { cwd: appRoot });
if (fs.existsSync(patch)) run('node', [patch], { cwd: appRoot });
if (fs.existsSync(applyRepo)) run('node', [applyRepo], { cwd: path.resolve(appRoot, '..', '..') });

fs.writeFileSync(marker, `applied ${new Date().toISOString()}\n`);
console.log('postinstall-apply-patches: applied and recorded marker', marker);
