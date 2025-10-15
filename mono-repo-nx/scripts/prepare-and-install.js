#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function run(cmd, args, opts = {}) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  if (res.status !== 0) {
    console.error(`${cmd} ${args.join(' ')} failed with code ${res.status}`);
    process.exit(res.status || 1);
  }
}

function hasCommand(cmd) {
  try {
    const r = spawnSync(cmd, ['--version'], { stdio: 'ignore', shell: true });
    return r.status === 0;
  } catch (e) {
    return false;
  }
}

const repoRoot = path.resolve(__dirname, '..');
const appRoot = path.join(repoRoot, 'apps', 'poliverai');
const arg = process.argv[2] || '';

// Run yarn at repo root
if (fs.existsSync(path.join(repoRoot, 'package.json'))) {
  run('yarn', [], { cwd: repoRoot });
}

// Run yarn in the app workspace but skip lifecycle scripts; we'll run the
// important postinstall steps at the right time below to avoid recursion
/// double-applying patches that are also triggered via postinstall.
if (fs.existsSync(path.join(appRoot, 'package.json'))) {
  if (hasCommand('yarn')) {
    run('yarn', ['install', '--ignore-scripts'], { cwd: appRoot });
  } else {
    console.warn('yarn not found in PATH; skipping app install');
  }
}

// Platform-specific preparation
if (arg === 'macos') {
  // Run macOS codegen path fixer if present
  const fixer = path.join(repoRoot, 'scripts', 'fix-macos-codegen-paths.sh');
  if (fs.existsSync(fixer)) {
    try {
      fs.chmodSync(fixer, 0o755);
    } catch (err) {
      console.warn(`failed to chmod ${fixer}: ${err.message}`);
    }
    run(fixer, [], { cwd: repoRoot });
  }

  // Take a macos snapshot if possible (best-effort)
  const snapshot = path.join(repoRoot, 'scripts', 'snapshot-macos-generated.js');
  if (fs.existsSync(snapshot)) {
    run('node', [snapshot], { cwd: repoRoot });
  }

  // After snapshot, run app-level postinstall steps (which create codegen
  // stubs) and then apply the repo-level worklets patch so files are
  // present for CocoaPods.
  const appPostinstall = path.join(appRoot, 'scripts', 'restore-codegen-stubs.js');
  const appPatch = path.join(appRoot, 'scripts', 'patch-react-native-worklets.js');
  if (fs.existsSync(appPostinstall)) {
    run('node', [appPostinstall], { cwd: appRoot });
  }
  if (fs.existsSync(appPatch)) {
    run('node', [appPatch], { cwd: appRoot });
  }

  // Apply RN worklets patch (repo-level) to ensure exact node_modules layout
  const applyPatch = path.join(repoRoot, 'scripts', 'apply-react-native-worklets-patch.js');
  if (fs.existsSync(applyPatch)) {
    run('node', [applyPatch], { cwd: repoRoot });
  }
  // Run pod install in macOS app if Podfile exists
  const macPodfile = path.join(appRoot, 'macos', 'Podfile');
  if (fs.existsSync(macPodfile)) {
    if (hasCommand('pod')) {
      run('pod', ['install'], { cwd: path.join(appRoot, 'macos') });
    } else {
      console.warn('pod not found in PATH; skipping pod install for macOS');
    }
  }
  // Re-run the apply patch after pod install so any header copies into
  // Pods/Headers made by the patch survive (pod install may recreate the
  // Pods/Headers layout and overwrite earlier copies).
  if (fs.existsSync(applyPatch)) {
    run('node', [applyPatch], { cwd: repoRoot });
  }
} else if (arg === 'ios') {
  // Ensure RN worklets patch is applied for iOS builds
  // First run app-level postinstall and app-level patch scripts so they
  // generate codegen stubs and disable autolinking where necessary.
  const appPostinstall = path.join(appRoot, 'scripts', 'restore-codegen-stubs.js');
  const appPatch = path.join(appRoot, 'scripts', 'patch-react-native-worklets.js');
  if (fs.existsSync(appPostinstall)) {
    run('node', [appPostinstall], { cwd: appRoot });
  }
  if (fs.existsSync(appPatch)) {
    run('node', [appPatch], { cwd: appRoot });
  }

  // Apply RN worklets patch (repo-level)
  const applyPatch = path.join(repoRoot, 'scripts', 'apply-react-native-worklets-patch.js');
  if (fs.existsSync(applyPatch)) {
    run('node', [applyPatch], { cwd: repoRoot });
  }

  // Run pod install in iOS app if Podfile exists
  const iosPodfile = path.join(appRoot, 'ios', 'Podfile');
  if (fs.existsSync(iosPodfile)) {
    if (hasCommand('pod')) {
      run('pod', ['install'], { cwd: path.join(appRoot, 'ios') });
    } else {
      console.warn('pod not found in PATH; skipping pod install for iOS');
    }
  }
  // Re-run apply patch after iOS pod install as well to ensure header
  // mirroring is applied into the Pods/Headers after CocoaPods has laid
  // out the headers.
  if (fs.existsSync(applyPatch)) {
    run('node', [applyPatch], { cwd: repoRoot });
  }
}

console.log('prepare-and-install: done');
