#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { ensureAppHoistedLinks } = require('../../../scripts/ensure-app-hoisted-links');

const appRoot = path.resolve(__dirname, '..');
const marker = path.join(appRoot, '.patches_applied');

if (process.env.SKIP_POSTINSTALL_PATCH === '1') {
  console.log('postinstall-apply-patches: SKIP_POSTINSTALL_PATCH=1; skipping');
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
const patchLottie = path.join(appRoot, 'scripts', 'patch-lottie-react-native.js');
const patchDotLottie = path.join(appRoot, 'scripts', 'patch-dotlottie-react-native.js');
const patchLucide = path.join(appRoot, 'scripts', 'patch-lucide-react-native.js');
const patchDocumentPicker = path.join(appRoot, 'scripts', 'patch-react-native-document-picker.js');
const patchDevMiddleware = path.join(appRoot, 'scripts', 'patch-react-native-dev-middleware.js');
const patchHermesExecutor = path.join(appRoot, 'scripts', 'patch-react-native-hermes-executor.js');
const patchJSRuntimeFactory = path.join(appRoot, 'scripts', 'patch-react-native-jsruntime-factory.js');
const applyRepo = path.join(appRoot, '..', '..', 'scripts', 'apply-react-native-worklets-patch.js');
const repoRoot = path.resolve(appRoot, '..', '..');

if (fs.existsSync(restore)) run('node', [restore], { cwd: appRoot });
if (fs.existsSync(patch)) run('node', [patch], { cwd: appRoot });
if (fs.existsSync(patchLottie)) run('node', [patchLottie], { cwd: appRoot });
if (fs.existsSync(patchDotLottie)) run('node', [patchDotLottie], { cwd: appRoot });
if (fs.existsSync(patchLucide)) run('node', [patchLucide], { cwd: appRoot });
if (fs.existsSync(patchDocumentPicker)) run('node', [patchDocumentPicker], { cwd: appRoot });
if (fs.existsSync(patchDevMiddleware)) run('node', [patchDevMiddleware], { cwd: appRoot });
if (fs.existsSync(patchHermesExecutor)) run('node', [patchHermesExecutor], { cwd: appRoot });
if (fs.existsSync(patchJSRuntimeFactory)) run('node', [patchJSRuntimeFactory], { cwd: appRoot });
if (fs.existsSync(applyRepo)) run('node', [applyRepo], { cwd: repoRoot });

ensureAppHoistedLinks({
  repoRoot,
  appRoot,
  logPrefix: 'postinstall-apply-patches',
});

try {
  if (fs.existsSync(marker) && process.platform === 'win32') {
    try {
      require('child_process').spawnSync('cmd', ['/c', 'attrib', '-H', '-R', marker], { stdio: 'ignore' });
    } catch (_) {
      // best-effort only
    }
    fs.rmSync(marker, { force: true });
  }
} catch (_) {
  // best-effort only
}

fs.writeFileSync(marker, `applied ${new Date().toISOString()}\n`);
console.log('postinstall-apply-patches: applied and recorded marker', marker);
