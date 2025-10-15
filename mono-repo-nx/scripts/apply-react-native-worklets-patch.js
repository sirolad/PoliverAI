#!/usr/bin/env node
// Apply the react-native-worklets patch from /patches/react-native-worklets into
// the installed node_modules/react-native-worklets package (works with hoisted
// or package-local node_modules). Idempotent.

const fs = require('fs');
const path = require('path');

function findPkgDir(startDir, pkgName) {
  let dir = startDir;
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, 'node_modules', pkgName);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

const repoRoot = path.resolve(__dirname, '..');
const startDir = path.resolve(process.cwd());
const targetPkgDir = findPkgDir(startDir, 'react-native-worklets') || findPkgDir(repoRoot, 'react-native-worklets');

function log(...args) { console.log('[apply-react-native-worklets-patch]', ...args); }

if (!targetPkgDir) {
  log('react-native-worklets not found in node_modules; skipping patch');
  process.exit(0);
}

const patchesDir = path.join(repoRoot, 'patches', 'react-native-worklets');
if (!fs.existsSync(patchesDir)) {
  log('patches directory missing:', patchesDir); process.exit(1);
}

// Copy files from patchesDir into targetPkgDir/android/build/generated/source/codegen/jni
const destDir = path.join(targetPkgDir, 'android', 'build', 'generated', 'source', 'codegen', 'jni');
fs.mkdirSync(destDir, { recursive: true });

const files = fs.readdirSync(patchesDir);
for (const f of files) {
  const src = path.join(patchesDir, f);
  const dst = path.join(destDir, f);
  fs.copyFileSync(src, dst);
  log('Copied', f, '->', dst);
}

// Ensure the package.json has our patched marker to avoid duplicate work
const pkgJson = path.join(targetPkgDir, 'package.json');
if (fs.existsSync(pkgJson)) {
  const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
  let changed = false;
  // Defensive: remove android/macos platforms from react-native field to prevent autolinking
  if (pkg['react-native'] && typeof pkg['react-native'] === 'object') {
    const rn = pkg['react-native'];
    if (rn['android']) { delete rn['android']; changed = true; }
    if (rn['macos']) { delete rn['macos']; changed = true; }
    if (Array.isArray(rn['platforms'])) {
      const before = rn['platforms'].slice();
      rn['platforms'] = rn['platforms'].filter(p => p !== 'android' && p !== 'macos');
      if (rn['platforms'].length !== before.length) changed = true;
      if (rn['platforms'].length === 0) delete rn['platforms'];
    }
    pkg['react-native'] = rn;
  }

  // Defensive: some packages include a codegenConfig (used by React Codegen).
  // Remove it so the RN codegen discovery doesn't parse this package and fail.
  if (pkg.codegenConfig) {
    delete pkg.codegenConfig;
    changed = true;
    log('Removed codegenConfig from package.json to avoid codegen discovery');
  }

  // If a local Podspec exists (RNWorklets.podspec) rename it so CocoaPods won't
  // autolink or include it from node_modules. This is idempotent.
  try {
    const podspec = path.join(targetPkgDir, 'RNWorklets.podspec');
    const podspecDisabled = path.join(targetPkgDir, 'RNWorklets.podspec.disabled');
    if (fs.existsSync(podspec) && !fs.existsSync(podspecDisabled)) {
      fs.renameSync(podspec, podspecDisabled);
      log('Renamed RNWorklets.podspec -> RNWorklets.podspec.disabled to prevent CocoaPods inclusion');
      changed = true;
    }
  } catch (err) {
    console.warn('[apply-react-native-worklets-patch] podspec rename failed:', err && err.message);
  }

  // Also, disable any macos native folder by renaming it to macos.disabled so
  // autolinking won't see real macos sources. Create a minimal macos stub if a
  // disabled folder exists to keep tooling happy.
  try {
    const macosDir = path.join(targetPkgDir, 'macos');
    const macosDisabled = path.join(targetPkgDir, 'macos.disabled');
    if (fs.existsSync(macosDir) && !fs.existsSync(macosDisabled)) {
      fs.renameSync(macosDir, macosDisabled);
      log('Renamed macos/ -> macos.disabled/ in installed package');
    }
    if (fs.existsSync(macosDisabled) && !fs.existsSync(macosDir)) {
      fs.mkdirSync(macosDir, { recursive: true });
      fs.writeFileSync(path.join(macosDir, 'README.md'), '# Disabled macos sources (poliverai patch)\n', 'utf8');
      log('Created minimal macos stub in installed package');
    }
    // Similarly handle Apple-specific `apple/` folder (react-native-worklets uses this).
    const appleDir = path.join(targetPkgDir, 'apple');
    const appleDisabled = path.join(targetPkgDir, 'apple.disabled');
    if (fs.existsSync(appleDir) && !fs.existsSync(appleDisabled)) {
      fs.renameSync(appleDir, appleDisabled);
      log('Renamed apple/ -> apple.disabled/ in installed package');
    }
    if (fs.existsSync(appleDisabled) && !fs.existsSync(appleDir)) {
      fs.mkdirSync(appleDir, { recursive: true });
      const dummy = `// Disabled apple sources (poliverai patch)\n#import <Foundation/Foundation.h>\n@interface RNWorklets_Dummy : NSObject @end\n@implementation RNWorklets_Dummy @end\n`;
      fs.writeFileSync(path.join(appleDir, 'RNWorkletsDummy.m'), dummy, 'utf8');
      log('Created minimal apple stub in installed package');
    }
    // If the original apple native sources were moved to apple.disabled and
    // they contain the worklets sources used by CocoaPods, copy them back into
    // the expected path (apple/worklets/apple) so the Pods project can find
    // the files during Xcode builds. This keeps the package disabled for
    // autolinking but preserves the exact paths CocoaPods expects.
    try {
      const disabledWorklets = path.join(appleDisabled, 'worklets', 'apple');
      const expectedWorklets = path.join(appleDir, 'worklets', 'apple');
      function copyRecursiveSync(src, dest) {
        if (!fs.existsSync(src)) return;
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
          fs.mkdirSync(dest, { recursive: true });
          const items = fs.readdirSync(src);
          for (const it of items) {
            copyRecursiveSync(path.join(src, it), path.join(dest, it));
          }
        } else {
          fs.copyFileSync(src, dest);
        }
      }
      if (fs.existsSync(disabledWorklets)) {
        copyRecursiveSync(disabledWorklets, expectedWorklets);
        log('Restored apple worklets sources to', expectedWorklets);
      }
    } catch (err) {
      console.warn('[apply-react-native-worklets-patch] restoring apple worklets failed:', err && err.message);
    }
  } catch (err) {
    console.warn('[apply-react-native-worklets-patch] macos stub step failed:', err && err.message);
  }

  // If we have macOS/iOS generated snapshots (from snapshot-macos-generated.js),
  // copy relevant generated headers into the app's Pods headers so Xcode can
  // resolve includes like <react/renderer/components/safeareacontext/Props.h>.
  try {
    const macosGenerated = path.join(repoRoot, 'patches', 'macos-generated', 'ios');
    const appPodsHeaders = path.join(repoRoot, 'apps', 'poliverai', 'macos', 'Pods', 'Headers', 'Private');
    if (fs.existsSync(macosGenerated) && fs.existsSync(path.join(repoRoot, 'apps', 'poliverai', 'macos'))) {
      // Copy ReactCodegen headers (they live under ReactCodegen/* or react/renderer/...)
      const srcReactCodegen = path.join(macosGenerated, 'Pods', 'Headers', 'Private', 'ReactCodegen');
      const dstReactCodegen = path.join(appPodsHeaders, 'ReactCodegen');
      function copyRecursive(src, dst) {
        if (!fs.existsSync(src)) return;
        const st = fs.statSync(src);
        if (st.isDirectory()) {
          fs.mkdirSync(dst, { recursive: true });
          for (const it of fs.readdirSync(src)) {
            copyRecursive(path.join(src, it), path.join(dst, it));
          }
        } else {
          fs.copyFileSync(src, dst);
        }
      }

      if (fs.existsSync(srcReactCodegen)) {
        copyRecursive(srcReactCodegen, dstReactCodegen);
        log('Copied ReactCodegen generated headers from patches into', dstReactCodegen);
      } else {
        // Fallback: some snapshots put generated headers under ios/.../react
        const alt = path.join(macosGenerated, 'react');
        if (fs.existsSync(alt)) {
          const dstAlt = path.join(appPodsHeaders, 'ReactCodegen', 'react');
          copyRecursive(alt, dstAlt);
          log('Copied generated react/* headers from patches into', dstAlt);
        }
      }
  // Also try to copy any public ReactCodegen headers from ios/Pods (if present
  // on the machine) into the app's Pods/Headers/Public/ReactCodegen so that
  // includes like <rngesturehandler_codegen/rngesturehandler_codegen.h>
  // (which are rooted under the ReactCodegen include directory) resolve.
      // Prepare paths for possible public ReactCodegen headers. Declare them
      // in this outer scope so subsequent mirroring code can reference them
      // even if the copy step below doesn't actually copy anything.
      const iosPublicRc = path.join(repoRoot, 'ios', 'Pods', 'Headers', 'Public', 'ReactCodegen');
      const appPublicRc = path.join(repoRoot, 'apps', 'poliverai', 'macos', 'Pods', 'Headers', 'Public', 'ReactCodegen');
      function copyIfExists(src, dst) {
        if (!fs.existsSync(src)) return false;
        const st = fs.statSync(src);
        if (st.isDirectory()) {
          fs.mkdirSync(dst, { recursive: true });
          for (const it of fs.readdirSync(src)) {
            const s = path.join(src, it);
            const d = path.join(dst, it);
            if (fs.statSync(s).isDirectory()) {
              copyIfExists(s, d);
            } else {
              fs.copyFileSync(s, d);
            }
          }
        } else {
          fs.mkdirSync(path.dirname(dst), { recursive: true });
          fs.copyFileSync(src, dst);
        }
        return true;
      }
      try {
        if (copyIfExists(iosPublicRc, appPublicRc)) {
          log('Copied Public ReactCodegen headers from ios/Pods into', appPublicRc);
        }
      } catch (err) {
        console.warn('[apply-react-native-worklets-patch] copying public ReactCodegen headers failed:', err && err.message);
      }
      // Many includes in the RN new-arch use a top-level <react/...> include
      // root. Ensure the 'react' folder from generated ReactCodegen headers is
      // mirrored into both the Public and Private Pods/Headers/react paths so
      // that #import <react/renderer/...> resolves during compile.
      try {
        const srcReactFolder1 = path.join(dstReactCodegen, 'react');
  const srcReactFolder2 = path.join(iosPublicRc, 'react');
        const dstPublicReact = path.join(repoRoot, 'apps', 'poliverai', 'macos', 'Pods', 'Headers', 'Public', 'react');
        const dstPrivateReact = path.join(repoRoot, 'apps', 'poliverai', 'macos', 'Pods', 'Headers', 'Private', 'react');
        function copyFolderIfExists(src, dst) {
          if (!fs.existsSync(src)) return;
          const stat = fs.statSync(src);
          if (stat.isDirectory()) {
            fs.mkdirSync(dst, { recursive: true });
            for (const it of fs.readdirSync(src)) {
              const s = path.join(src, it);
              const d = path.join(dst, it);
              const st = fs.statSync(s);
              if (st.isDirectory()) {
                copyFolderIfExists(s, d);
              } else {
                fs.copyFileSync(s, d);
              }
            }
          }
        }
        copyFolderIfExists(srcReactFolder1, dstPublicReact);
        copyFolderIfExists(srcReactFolder1, dstPrivateReact);
        copyFolderIfExists(srcReactFolder2, dstPublicReact);
        log('Mirrored top-level react/ include tree into Pods Public and Private header trees');
      } catch (err) {
        console.warn('[apply-react-native-worklets-patch] mirroring top-level react tree failed:', err && err.message);
      }
      // Also copy generated safeareacontext headers (these are referenced as
      // <safeareacontext/safeareacontext.h> from the safe-area package). Put
      // them into the Pods/Headers/Public/safeareacontext so the imports resolve.
      try {
        const srcSafeArea = path.join(macosGenerated, 'ios-generated', 'safeareacontext');
        const dstSafeArea = path.join(repoRoot, 'apps', 'poliverai', 'macos', 'Pods', 'Headers', 'Public', 'safeareacontext');
        function copySafeArea(src, dst) {
          if (!fs.existsSync(src)) return;
          const st = fs.statSync(src);
          if (st.isDirectory()) {
            fs.mkdirSync(dst, { recursive: true });
            for (const it of fs.readdirSync(src)) {
              copySafeArea(path.join(src, it), path.join(dst, it));
            }
          } else {
            fs.copyFileSync(src, dst);
          }
        }
        if (fs.existsSync(srcSafeArea)) {
          copySafeArea(srcSafeArea, dstSafeArea);
          log('Copied safeareacontext generated headers into', dstSafeArea);
        }
      } catch (err) {
        console.warn('[apply-react-native-worklets-patch] copying safeareacontext headers failed:', err && err.message);
      }
      // Mirror react/renderer component headers into the Public ReactCodegen tree
      // too: some targets include headers via the ReactCodegen public include
      // root (e.g. #import <react/renderer/components/...>) while others expect
      // them under Pods/Headers/Private. Copy into both places if available.
      try {
        const publicReact = path.join(repoRoot, 'apps', 'poliverai', 'macos', 'Pods', 'Headers', 'Public', 'ReactCodegen', 'react', 'renderer', 'components');
        function copyTreeIfExists(srcRoot, dstRoot) {
          if (!fs.existsSync(srcRoot)) return;
          fs.mkdirSync(dstRoot, { recursive: true });
          const parts = fs.readdirSync(srcRoot);
          for (const p of parts) {
            const s = path.join(srcRoot, p);
            const d = path.join(dstRoot, p);
            const st = fs.statSync(s);
            if (st.isDirectory()) {
              copyTreeIfExists(s, d);
            } else {
              fs.copyFileSync(s, d);
            }
          }
        }
        copyTreeIfExists(path.join(appPodsHeaders, 'ReactCodegen', 'react', 'renderer', 'components'), publicReact);
        log('Mirrored react/renderer component headers into Public ReactCodegen include tree', publicReact);
      } catch (err) {
        console.warn('[apply-react-native-worklets-patch] mirroring react renderer components failed:', err && err.message);
      }
    }
  } catch (err) {
    console.warn('[apply-react-native-worklets-patch] copying generated headers failed:', err && err.message);
  }

  // Additionally, if we have persisted local patches for native modules (for
  // example to make certain pods compile across RN versions), apply them into
  // the installed node_modules packages. This is idempotent: we only copy
  // files that exist in patches/<moduleName> into node_modules/<moduleName>.
  try {
    const repoPatchesRoot = path.join(repoRoot, 'patches');
    const modulePatches = [
      { name: 'react-native-gesture-handler', rel: 'react-native-gesture-handler' },
    ];
    for (const m of modulePatches) {
      const patchDir = path.join(repoPatchesRoot, m.rel);
      if (!fs.existsSync(patchDir)) continue;
      const targetDir = findPkgDir(startDir, m.name) || findPkgDir(repoRoot, m.name);
      if (!targetDir) {
        log('Patch target not installed, skipping patch for', m.name);
        continue;
      }
      function copyDir(src, dest) {
        if (!fs.existsSync(src)) return;
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
          fs.mkdirSync(dest, { recursive: true });
          const items = fs.readdirSync(src);
          for (const it of items) {
            copyDir(path.join(src, it), path.join(dest, it));
          }
        } else {
          fs.copyFileSync(src, dest);
        }
      }
      copyDir(patchDir, targetDir);
      log('Applied persistent patches for', m.name, 'into', targetDir);
    }
  } catch (err) {
    console.warn('[apply-react-native-worklets-patch] applying module patches failed:', err && err.message);
  }

  if (!pkg.__poliverai_patched || changed) {
    pkg.__poliverai_patched = true;
    fs.writeFileSync(pkgJson, JSON.stringify(pkg, null, 2), 'utf8');
    log('Patched package.json (marked and sanitized react-native fields)');
  } else {
    log('package.json already patched and sanitized');
  }
}

log('Patch applied successfully');
