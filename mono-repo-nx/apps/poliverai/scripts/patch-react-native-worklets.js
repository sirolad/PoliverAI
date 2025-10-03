#!/usr/bin/env node
// Idempotent patch to make react-native-worklets safe for this monorepo
// - Limits effect to node_modules/react-native-worklets
// - Removes Android and macOS platform entries from its package.json "react-native" field
// - Adds a small marker to avoid reapplying

const fs = require('fs');
const path = require('path');

// Try to locate the installed package.json by walking up the directory tree from
// this script's location. This handles monorepo node_modules at the repo root or
// package-local node_modules.
function findInstalledPkg(startDir, packageName) {
  let dir = startDir;
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, 'node_modules', packageName, 'package.json');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const startDir = path.resolve(__dirname);
const targetPkgPath = findInstalledPkg(startDir, 'react-native-worklets');

function log(...args) { console.log('[patch-react-native-worklets]', ...args); }

try {
  if (!targetPkgPath || !fs.existsSync(targetPkgPath)) {
    log('react-native-worklets package.json not found (no-op). Looked from', startDir);
    process.exit(0);
  }

  const raw = fs.readFileSync(targetPkgPath, 'utf8');
  const pkg = JSON.parse(raw);

  // marker to avoid reapplying
  if (pkg.__poliverai_patched) {
    log('Already patched - nothing to do.');
    process.exit(0);
  }

  // If package has a "react-native" entry that declares platforms, remove android and macos
  // to prevent autolinking into Android and macOS native projects while keeping iOS.
  if (pkg['react-native']) {
    const rn = pkg['react-native'];
    if (typeof rn === 'object') {
    // remove android/macos keys if present
      delete rn['android'];
      delete rn['macos'];
      // also remove platforms array if it contains android or macos
      if (Array.isArray(rn['platforms'])) {
        rn['platforms'] = rn['platforms'].filter(p => p !== 'android' && p !== 'macos');
        if (rn['platforms'].length === 0) delete rn['platforms'];
      }
      pkg['react-native'] = rn;
      log('Updated react-native field: removed android/macos entries');
    }
  }

  // Remove codegenConfig if present to avoid React Codegen parsing this package.
  if (pkg.codegenConfig) {
    delete pkg.codegenConfig;
    log('Removed codegenConfig from package.json to avoid codegen discovery');
  }

  // Additionally, disable the Android native folder (if present) by renaming it so
  // Gradle/CMake won't discover and attempt to build it. Keep the disabled copy so
  // it's reversible when needed.
  try {
    const androidDir = path.join(path.dirname(targetPkgPath), 'android');
    const disabledDir = path.join(path.dirname(targetPkgPath), 'android.disabled');
    if (fs.existsSync(androidDir) && !fs.existsSync(disabledDir)) {
      fs.renameSync(androidDir, disabledDir);
      log('Renamed android/ -> android.disabled/ to prevent Android native build');
    } else if (fs.existsSync(disabledDir)) {
      log('android.disabled already present - Android sources already disabled');
    }
  } catch (err) {
    // Non-fatal: log and continue
    console.warn('[patch-react-native-worklets] android disable step failed:', err && err.message);
  }

  // Rename local podspec if present so CocoaPods doesn't pick it up from node_modules
  try {
    const pkgDir = path.dirname(targetPkgPath);
    const podspec = path.join(pkgDir, 'RNWorklets.podspec');
    const podspecDisabled = path.join(pkgDir, 'RNWorklets.podspec.disabled');
    if (fs.existsSync(podspec) && !fs.existsSync(podspecDisabled)) {
      fs.renameSync(podspec, podspecDisabled);
      log('Renamed RNWorklets.podspec -> RNWorklets.podspec.disabled to avoid CocoaPods autolink');
    }
  } catch (err) {
    console.warn('[patch-react-native-worklets] podspec rename failed:', err && err.message);
  }

  // Additionally, disable the macOS native folder (if present) by renaming it so
  // the macOS autolinking/codegen won't discover and attempt to include it. Keep
  // the disabled copy so it's reversible when needed.
  try {
    const macosDir = path.join(path.dirname(targetPkgPath), 'macos');
    const macosDisabled = path.join(path.dirname(targetPkgPath), 'macos.disabled');
    if (fs.existsSync(macosDir) && !fs.existsSync(macosDisabled)) {
      fs.renameSync(macosDir, macosDisabled);
      log('Renamed macos/ -> macos.disabled/ to prevent macOS native build');
    } else if (fs.existsSync(macosDisabled)) {
      log('macos.disabled already present - macOS sources already disabled');
    }
    // Some packages place Apple-specific sources under `apple/` (e.g. react-native-worklets).
    // Also disable that folder if present and replace it with a minimal stub so the Pod
    // subspec that references it can still be satisfied without compiling the real sources.
    const appleDir = path.join(path.dirname(targetPkgPath), 'apple');
    const appleDisabled = path.join(path.dirname(targetPkgPath), 'apple.disabled');
    const appleStub = path.join(path.dirname(targetPkgPath), 'apple');
    if (fs.existsSync(appleDir) && !fs.existsSync(appleDisabled)) {
      fs.renameSync(appleDir, appleDisabled);
      log('Renamed apple/ -> apple.disabled/ to prevent Apple native build');
    }
    if (fs.existsSync(appleDisabled) && !fs.existsSync(appleStub)) {
      fs.mkdirSync(appleStub, { recursive: true });
      // write a minimal objective-c file that does nothing but satisfy file globs
      const dummy = `// Disabled apple sources (poliverai patch)\n#import <Foundation/Foundation.h>\n@interface RNWorklets_Dummy : NSObject @end\n@implementation RNWorklets_Dummy @end\n`;
      fs.writeFileSync(path.join(appleStub, 'RNWorkletsDummy.m'), dummy, 'utf8');
      log('Created minimal apple stub folder to satisfy tooling');
    }
  } catch (err) {
    console.warn('[patch-react-native-worklets] macos disable step failed:', err && err.message);
  }

  // If we disabled the real android folder, create a minimal stub android module so
  // Gradle still sees a consumable library variant but there are no native sources
  // to compile. This avoids "No variants exist" or C++ compile failures.
  try {
    const pkgDir = path.dirname(targetPkgPath);
    const disabledDir = path.join(pkgDir, 'android.disabled');
    const stubDir = path.join(pkgDir, 'android');
    if (fs.existsSync(disabledDir) && !fs.existsSync(stubDir)) {
      fs.mkdirSync(stubDir, { recursive: true });
      const buildGradle = `plugins {\n  id 'com.android.library'\n}\n\nandroid {\n  namespace 'com.swmansion.worklets.stub'\n  compileSdk 33\n  defaultConfig {\n    minSdk 21\n  }\n}\n`;
      fs.writeFileSync(path.join(stubDir, 'build.gradle'), buildGradle, 'utf8');
      // minimal java source so Gradle sees a valid module
      const javaSrcDir = path.join(stubDir, 'src', 'main', 'java', 'com', 'swmansion', 'worklets', 'stub');
      fs.mkdirSync(javaSrcDir, { recursive: true });
      const placeholder = `package com.swmansion.worklets.stub;\npublic class WorkletsStub {}\n`;
      fs.writeFileSync(path.join(javaSrcDir, 'WorkletsStub.java'), placeholder, 'utf8');
      log('Created minimal android stub module to satisfy Gradle');
    }
  } catch (err) {
    console.warn('[patch-react-native-worklets] android stub creation failed:', err && err.message);
  }

  // Create a minimal macOS stub folder so downstream tooling that expects a macos
  // directory won't fail searching for the path. The stub contains a README so it
  // is harmless and won't be autolinked because we've removed the macos entry in
  // package.json above.
  try {
    const pkgDir = path.dirname(targetPkgPath);
    const disabledMacos = path.join(pkgDir, 'macos.disabled');
    const stubMacos = path.join(pkgDir, 'macos');
    if (fs.existsSync(disabledMacos) && !fs.existsSync(stubMacos)) {
      fs.mkdirSync(stubMacos, { recursive: true });
      fs.writeFileSync(path.join(stubMacos, 'README.md'), '# Disabled macos sources (poliverai patch)\n', 'utf8');
      log('Created minimal macos stub folder to satisfy tooling');
    }
  } catch (err) {
    console.warn('[patch-react-native-worklets] macos stub creation failed:', err && err.message);
  }

  // Create a minimal codegen CMake placeholder so React Native's CMake add_subdirectory
  // (which expects generated JNI code) succeeds even when we intentionally disable
  // the real native sources. This defines an empty INTERFACE target named the same
  // codegen uses so later target_link_libraries calls don't fail.
  try {
    const pkgDir = path.dirname(targetPkgPath);
    const codegenDir = path.join(pkgDir, 'android', 'build', 'generated', 'source', 'codegen', 'jni');
    const cmakeFile = path.join(codegenDir, 'CMakeLists.txt');
    if (!fs.existsSync(cmakeFile)) {
      fs.mkdirSync(codegenDir, { recursive: true });
      const cmakeContents = `# Placeholder CMake for react-native-worklets codegen
add_library(react_codegen_rnworklets INTERFACE)
set_target_properties(react_codegen_rnworklets PROPERTIES INTERFACE_LINK_LIBRARIES "")
`;
      fs.writeFileSync(cmakeFile, cmakeContents, 'utf8');
      log('Wrote placeholder codegen CMake at', cmakeFile);
    } else {
      log('Codegen CMake already present at', cmakeFile);
    }
  } catch (err) {
    console.warn('[patch-react-native-worklets] codegen placeholder creation failed:', err && err.message);
  }

  // Add marker and write back
  pkg.__poliverai_patched = true;

  fs.writeFileSync(targetPkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  log('Patched', targetPkgPath);
} catch (err) {
  console.error('[patch-react-native-worklets] failed:', err && err.message);
  process.exit(1);
}
