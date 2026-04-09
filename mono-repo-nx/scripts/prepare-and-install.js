#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const {
  ensureAppHoistedLinks,
  removeAppHoistedLinks,
  WINDOWS_APP_LOCAL_PACKAGES,
  WINDOWS_LINKED_PACKAGES,
} = require('./ensure-app-hoisted-links');

function run(cmd, args, opts = {}) {
  console.log(`> ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      LANG: 'en_US.UTF-8',
      LC_ALL: 'en_US.UTF-8',
      ...(opts.env || {}),
    },
    ...opts,
  });
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

function copyDirectoryContents(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return false;

  fs.mkdirSync(targetDir, { recursive: true });
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectoryContents(sourcePath, targetPath);
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }

  return true;
}

function isStubCodegenPodspec(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('Temporary stub for ReactCodegen') ||
    content.includes('Temporary stub for ReactAppDependencyProvider');
}

function hydrateMacOSGeneratedCodegenArtifacts() {
  const canonicalSource = path.join(appRoot, 'ios', 'build', 'generated', 'ios');
  const canonicalPodspec = path.join(canonicalSource, 'ReactCodegen.podspec');
  if (!fs.existsSync(canonicalPodspec) || isStubCodegenPodspec(canonicalPodspec)) {
    return;
  }

  const targets = [
    path.join(repoRoot, 'patches', 'macos-generated', 'ios', 'ios-generated'),
    path.join(appRoot, 'macos', 'build', 'generated', 'ios'),
  ];

  for (const targetDir of targets) {
    copyDirectoryContents(canonicalSource, targetDir);
    console.log(`> hydrated generated codegen artifacts from ${canonicalSource} -> ${targetDir}`);
  }
}

function normalizeReactCodegenPodspec(filePath) {
  if (!fs.existsSync(filePath)) return;

  const badRnDir =
    'export RCT_SCRIPT_RN_DIR="$RCT_SCRIPT_POD_INSTALLATION_ROOT/../../../../../../../../../../../../../../../PoliverAI/mono-repo-nx/apps/poliverai/node_modules/react-native"';
  const badAppPath =
    'export RCT_SCRIPT_APP_PATH="$RCT_SCRIPT_POD_INSTALLATION_ROOT/../../../../../../../../../../../../../../../PoliverAI/mono-repo-nx/apps/poliverai"';
  const goodRnDir =
    'export RCT_SCRIPT_RN_DIR="$RCT_SCRIPT_POD_INSTALLATION_ROOT/../node_modules/react-native"';
  const goodAppPath =
    'export RCT_SCRIPT_APP_PATH="$RCT_SCRIPT_POD_INSTALLATION_ROOT/.."';

  const current = fs.readFileSync(filePath, 'utf8');
  const next = current
    .replaceAll(badRnDir, goodRnDir)
    .replaceAll(badAppPath, goodAppPath);

  if (next !== current) {
    fs.writeFileSync(filePath, next);
    console.log(`> normalized ReactCodegen podspec paths in ${filePath}`);
  }
}

function normalizeGeneratedReactCodegenPodspecs() {
  const candidates = [
    path.join(repoRoot, 'patches', 'macos-generated', 'ios', 'ios-generated', 'ReactCodegen.podspec'),
    path.join(appRoot, 'macos', 'build', 'generated', 'ios', 'ReactCodegen.podspec'),
    path.join(appRoot, 'ios', 'build', 'generated', 'ios', 'ReactCodegen.podspec'),
  ];

  for (const filePath of candidates) {
    normalizeReactCodegenPodspec(filePath);
  }
}

function ensureReactNativeGradlePluginArtifacts() {
  const pluginRoot = path.join(repoRoot, 'node_modules', '@react-native', 'gradle-plugin');
  const sharedJar = path.join(pluginRoot, 'shared', 'build', 'libs', 'shared.jar');
  const pluginJar = path.join(
    pluginRoot,
    'react-native-gradle-plugin',
    'build',
    'libs',
    'react-native-gradle-plugin.jar'
  );

  if (fs.existsSync(sharedJar) && fs.existsSync(pluginJar)) {
    return;
  }

  const gradlew = path.join(pluginRoot, 'gradlew');
  if (!fs.existsSync(gradlew)) {
    console.warn('react-native gradle plugin sources not found; skipping plugin artifact build');
    return;
  }

  try {
    fs.chmodSync(gradlew, 0o755);
  } catch (err) {
    console.warn(`failed to chmod ${gradlew}: ${err.message}`);
  }

  run('./gradlew', ['--no-daemon', ':shared:jar', ':react-native-gradle-plugin:jar'], {
    cwd: pluginRoot,
  });
}

// Run yarn at repo root
if (fs.existsSync(path.join(repoRoot, 'package.json'))) {
  run('yarn', ['--ignore-engines'], { cwd: repoRoot });
}

// Do not run a second install inside the app workspace.
// This repo is already managed from the workspace root, and re-running
// `yarn install` in apps/poliverai causes duplicate .bin symlink conflicts.

if (arg === 'windows') {
  removeAppHoistedLinks({
    appRoot,
    packages: WINDOWS_APP_LOCAL_PACKAGES,
    logPrefix: 'prepare-and-install',
  });
} else {
  ensureAppHoistedLinks({
    repoRoot,
    appRoot,
    logPrefix: 'prepare-and-install',
  });
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
  hydrateMacOSGeneratedCodegenArtifacts();
  normalizeGeneratedReactCodegenPodspecs();

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
  hydrateMacOSGeneratedCodegenArtifacts();
  normalizeGeneratedReactCodegenPodspecs();

  // Apply RN worklets patch (repo-level) to ensure exact node_modules layout
  const applyPatch = path.join(repoRoot, 'scripts', 'apply-react-native-worklets-patch.js');
  if (fs.existsSync(applyPatch)) {
    run('node', [applyPatch], { cwd: repoRoot });
  }
  hydrateMacOSGeneratedCodegenArtifacts();
  normalizeGeneratedReactCodegenPodspecs();
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
  hydrateMacOSGeneratedCodegenArtifacts();
  normalizeGeneratedReactCodegenPodspecs();
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
  normalizeGeneratedReactCodegenPodspecs();

  // Apply RN worklets patch (repo-level)
  const applyPatch = path.join(repoRoot, 'scripts', 'apply-react-native-worklets-patch.js');
  if (fs.existsSync(applyPatch)) {
    run('node', [applyPatch], { cwd: repoRoot });
  }
  normalizeGeneratedReactCodegenPodspecs();

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
  normalizeGeneratedReactCodegenPodspecs();
} else if (arg === 'android') {
  ensureReactNativeGradlePluginArtifacts();
} else if (arg === 'windows') {
  const windowsPatch = path.join(repoRoot, 'scripts', 'patch-react-native-windows-projects.js');
  if (fs.existsSync(windowsPatch)) {
    run('node', [windowsPatch], { cwd: repoRoot });
  }
}

ensureAppHoistedLinks({
  repoRoot,
  appRoot,
  packages: arg === 'windows' ? WINDOWS_LINKED_PACKAGES : undefined,
  logPrefix: 'prepare-and-install',
});

console.log('prepare-and-install: done');
