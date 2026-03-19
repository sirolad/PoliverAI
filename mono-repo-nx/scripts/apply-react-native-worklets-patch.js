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
const gestureHandlerPkgDir =
  findPkgDir(startDir, 'react-native-gesture-handler') || findPkgDir(repoRoot, 'react-native-gesture-handler');
const screensPkgDir =
  findPkgDir(startDir, 'react-native-screens') || findPkgDir(repoRoot, 'react-native-screens');

function log(...args) { console.log('[apply-react-native-worklets-patch]', ...args); }

function patchScreensEdgeToEdgeForAndroid(pkgDir) {
  if (!pkgDir) {
    return;
  }

  const detectorPath = path.join(
    pkgDir,
    'android',
    'src',
    'versioned',
    'edge-to-edge',
    'latest',
    'com',
    'swmansion',
    'rnscreens',
    'utils',
    'EdgeToEdgeDetector.kt'
  );
  if (!fs.existsSync(detectorPath)) {
    return;
  }

  const source = fs.readFileSync(detectorPath, 'utf8');
  const next = source
    .replace("import com.facebook.react.views.view.isEdgeToEdgeFeatureFlagOn\n\n", '')
    .replace(
      `    // For RN >= 0.81, we use both isEdgeToEdgeFeatureFlagOn (from react-native) and the presence of
    // react-native-edge-to-edge package to determine if app is in edge-to-edge.
    val ENABLED: Boolean =
        isEdgeToEdgeFeatureFlagOn ||
            try {`,
      `    // RN 0.79 does not expose isEdgeToEdgeFeatureFlagOn, so fall back to checking
    // whether react-native-is-edge-to-edge is present.
    val ENABLED: Boolean =
        try {`
    );

  if (next === source) {
    log('react-native-screens Android edge-to-edge patch already applied');
    return;
  }

  fs.writeFileSync(detectorPath, next, 'utf8');
  log('Patched react-native-screens Android edge-to-edge detector in', detectorPath);
}

function patchGestureHandlerForApple(pkgDir) {
  if (!pkgDir) {
    return;
  }

  const modulePath = path.join(pkgDir, 'apple', 'RNGestureHandlerModule.mm');
  if (!fs.existsSync(modulePath)) {
    return;
  }

  const source = fs.readFileSync(modulePath, 'utf8');
  const before = `#if REACT_NATIVE_MINOR_VERSION >= 81
        auto shadowNode = Bridging<std::shared_ptr<const ShadowNode>>::fromJs(runtime, arguments[0]);
#else
        auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);
#endif

        if (dynamic_pointer_cast<const ParagraphShadowNode>(shadowNode)) {
          return jsi::Value(true);
        }

        if (dynamic_pointer_cast<const TextShadowNode>(shadowNode)) {
          return jsi::Value(true);
        }

        bool isViewFlatteningDisabled = shadowNode->getTraits().check(ShadowNodeTraits::FormsStackingContext);

        return jsi::Value(isViewFlatteningDisabled);`;
  const transitional = `auto shadowNode = shadowNodeFromValue(runtime, arguments[0]);

        bool isViewFlatteningDisabled = shadowNode->getTraits().check(ShadowNodeTraits::FormsStackingContext);
        const char *componentName = shadowNode->getComponentName();
        bool isTextComponent = strcmp(componentName, "Paragraph") == 0 || strcmp(componentName, "Text") == 0;

        return jsi::Value(isViewFlatteningDisabled || isTextComponent);`;
  const after = `#if REACT_NATIVE_MINOR_VERSION >= 81
        auto shadowNode = Bridging<std::shared_ptr<const ShadowNode>>::fromJs(runtime, arguments[0]);
#else
        auto shadowNode = facebook::react::shadowNodeFromValue(runtime, arguments[0]);
#endif

        bool isViewFlatteningDisabled = shadowNode->getTraits().check(ShadowNodeTraits::FormsStackingContext);
        const char *componentName = shadowNode->getComponentName();
        bool isTextComponent = strcmp(componentName, "Paragraph") == 0 || strcmp(componentName, "Text") == 0;

        return jsi::Value(isViewFlatteningDisabled || isTextComponent);`;
  const bridgingInclude = '#import <react/bridging/Bridging.h>\n';
  const runtimeInclude = '#import <react/renderer/uimanager/primitives.h>\n';

  let next = source;
  if (!next.includes(bridgingInclude)) {
    next = next.replace(runtimeInclude, bridgingInclude + runtimeInclude);
  }

  if (next.includes(before)) {
    next = next.replace(before, after);
  } else if (next.includes(transitional)) {
    next = next.replace(transitional, after);
  }

  if (next === source) {
    log('react-native-gesture-handler Apple ShadowNode patch already applied');
    return;
  }

  fs.writeFileSync(modulePath, next, 'utf8');
  log('Patched react-native-gesture-handler Apple ShadowNode conversion in', modulePath);
}

if (!targetPkgDir) {
  log('react-native-worklets not found in node_modules; skipping patch');
  patchGestureHandlerForApple(gestureHandlerPkgDir);
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

  // If we have generated snapshots, copy relevant generated headers into the
  // app's iOS/macOS Pods headers so Xcode can resolve includes like
  // <react/renderer/components/safeareacontext/Props.h>.
  try {
    const generatedSourceCandidates = [
      path.join(repoRoot, 'apps', 'poliverai', 'ios', 'build', 'generated', 'ios'),
      path.join(repoRoot, 'patches', 'macos-generated', 'ios', 'ios-generated'),
    ];
    const generatedRoot = generatedSourceCandidates.find((candidate) => fs.existsSync(candidate));

    const platformConfigs = ['macos', 'ios']
      .map((platformName) => {
        const appPlatformRoot = path.join(repoRoot, 'apps', 'poliverai', platformName);
        const podsRoot = path.join(appPlatformRoot, 'Pods');
        if (!fs.existsSync(podsRoot)) {
          return null;
        }
        return {
          platformName,
          appPlatformRoot,
          podsRoot,
          privateHeaders: path.join(podsRoot, 'Headers', 'Private'),
          publicHeaders: path.join(podsRoot, 'Headers', 'Public'),
        };
      })
      .filter(Boolean);

    if (generatedRoot && platformConfigs.length > 0) {
      // Copy ReactCodegen headers (they live under ReactCodegen/* or react/renderer/...)
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

      for (const platform of platformConfigs) {
        const srcReactCodegen = path.join(platform.privateHeaders, 'ReactCodegen');
        const dstReactCodegen = path.join(platform.privateHeaders, 'ReactCodegen');
        const appPublicRc = path.join(platform.publicHeaders, 'ReactCodegen');

        const altReactTree = path.join(generatedRoot, 'react');
        if (fs.existsSync(altReactTree)) {
          const dstAlt = path.join(dstReactCodegen, 'react');
          copyRecursive(altReactTree, dstAlt);
          log(`Copied generated react/* headers into ${platform.platformName} Pods`, dstAlt);
        }

        try {
          if (copyIfExists(path.join(platform.publicHeaders, 'ReactCodegen'), appPublicRc)) {
            log(`Refreshed Public ReactCodegen headers for ${platform.platformName}`, appPublicRc);
          }
        } catch (err) {
          console.warn('[apply-react-native-worklets-patch] copying public ReactCodegen headers failed:', err && err.message);
        }

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

        const dstPublicReact = path.join(platform.publicHeaders, 'react');
        const dstPrivateReact = path.join(platform.privateHeaders, 'react');
        copyFolderIfExists(path.join(dstReactCodegen, 'react'), dstPublicReact);
        copyFolderIfExists(path.join(dstReactCodegen, 'react'), dstPrivateReact);
        log(`Mirrored top-level react/ include tree for ${platform.platformName}`);

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

        const srcSafeArea = path.join(generatedRoot, 'safeareacontext');
        const dstSafeArea = path.join(platform.publicHeaders, 'safeareacontext');
        if (fs.existsSync(srcSafeArea)) {
          copySafeArea(srcSafeArea, dstSafeArea);
          log(`Copied safeareacontext generated headers into ${platform.platformName} Pods`, dstSafeArea);
        }

        const srcSafeAreaReact = path.join(
          generatedRoot,
          'react',
          'renderer',
          'components',
          'safeareacontext'
        );
        const dstPublicSafeAreaReact = path.join(
          platform.publicHeaders,
          'react',
          'renderer',
          'components',
          'safeareacontext'
        );
        const dstPrivateSafeAreaReact = path.join(
          platform.privateHeaders,
          'react',
          'renderer',
          'components',
          'safeareacontext'
        );
        function copySafeAreaReactTree(src, dst) {
          if (!fs.existsSync(src)) return;
          const st = fs.statSync(src);
          if (st.isDirectory()) {
            fs.mkdirSync(dst, { recursive: true });
            for (const it of fs.readdirSync(src)) {
              copySafeAreaReactTree(path.join(src, it), path.join(dst, it));
            }
          } else {
            fs.copyFileSync(src, dst);
          }
        }
        if (fs.existsSync(srcSafeAreaReact)) {
          copySafeAreaReactTree(srcSafeAreaReact, dstPublicSafeAreaReact);
          copySafeAreaReactTree(srcSafeAreaReact, dstPrivateSafeAreaReact);
          log(`Mirrored safeareacontext react headers for ${platform.platformName}`);
        }

        const srcRnsvgReact = path.join(
          generatedRoot,
          'react',
          'renderer',
          'components',
          'rnsvg'
        );
        const dstPublicRnsvgReact = path.join(
          platform.publicHeaders,
          'react',
          'renderer',
          'components',
          'rnsvg'
        );
        const dstPrivateRnsvgReact = path.join(
          platform.privateHeaders,
          'react',
          'renderer',
          'components',
          'rnsvg'
        );
        function copyRnsvgReactTree(src, dst) {
          if (!fs.existsSync(src)) return;
          const st = fs.statSync(src);
          if (st.isDirectory()) {
            fs.mkdirSync(dst, { recursive: true });
            for (const it of fs.readdirSync(src)) {
              copyRnsvgReactTree(path.join(src, it), path.join(dst, it));
            }
          } else {
            fs.copyFileSync(src, dst);
          }
        }
        if (fs.existsSync(srcRnsvgReact)) {
          copyRnsvgReactTree(srcRnsvgReact, dstPublicRnsvgReact);
          copyRnsvgReactTree(srcRnsvgReact, dstPrivateRnsvgReact);
          log(`Mirrored rnsvg react headers for ${platform.platformName}`);
        }

        const srcRnsvg = path.join(generatedRoot, 'rnsvg');
        const dstPublicRnsvg = path.join(platform.publicHeaders, 'rnsvg');
        const dstPrivateRnsvg = path.join(platform.privateHeaders, 'rnsvg');
        const dstPublicRNSVG = path.join(platform.publicHeaders, 'RNSVG');
        const dstPrivateRNSVG = path.join(platform.privateHeaders, 'RNSVG');
        function copyRnsvgHeaders(src, dst) {
          if (!fs.existsSync(src)) return;
          const st = fs.statSync(src);
          if (st.isDirectory()) {
            fs.mkdirSync(dst, { recursive: true });
            for (const it of fs.readdirSync(src)) {
              copyRnsvgHeaders(path.join(src, it), path.join(dst, it));
            }
          } else {
            fs.copyFileSync(src, dst);
          }
        }
        if (fs.existsSync(srcRnsvg)) {
          copyRnsvgHeaders(srcRnsvg, dstPublicRnsvg);
          copyRnsvgHeaders(srcRnsvg, dstPrivateRnsvg);
          copyRnsvgHeaders(srcRnsvg, dstPublicRNSVG);
          copyRnsvgHeaders(srcRnsvg, dstPrivateRNSVG);
          log(`Mirrored rnsvg generated headers for ${platform.platformName}`);
        }

        const srcRnghReact = path.join(
          generatedRoot,
          'react',
          'renderer',
          'components',
          'rngesturehandler_codegen'
        );
        const dstPublicRnghReact = path.join(
          platform.publicHeaders,
          'react',
          'renderer',
          'components',
          'rngesturehandler_codegen'
        );
        const dstPrivateRnghReact = path.join(
          platform.privateHeaders,
          'react',
          'renderer',
          'components',
          'rngesturehandler_codegen'
        );
        function copyRnghReactTree(src, dst) {
          if (!fs.existsSync(src)) return;
          const st = fs.statSync(src);
          if (st.isDirectory()) {
            fs.mkdirSync(dst, { recursive: true });
            for (const it of fs.readdirSync(src)) {
              copyRnghReactTree(path.join(src, it), path.join(dst, it));
            }
          } else {
            fs.copyFileSync(src, dst);
          }
        }
        if (fs.existsSync(srcRnghReact)) {
          copyRnghReactTree(srcRnghReact, dstPublicRnghReact);
          copyRnghReactTree(srcRnghReact, dstPrivateRnghReact);
          log(`Mirrored rngesturehandler_codegen react headers for ${platform.platformName}`);
        }

        const srcRngh = path.join(generatedRoot, 'rngesturehandler_codegen');
        const dstPublicRngh = path.join(platform.publicHeaders, 'rngesturehandler_codegen');
        const dstPrivateRngh = path.join(platform.privateHeaders, 'rngesturehandler_codegen');
        function copyRnghHeaders(src, dst) {
          if (!fs.existsSync(src)) return;
          const st = fs.statSync(src);
          if (st.isDirectory()) {
            fs.mkdirSync(dst, { recursive: true });
            for (const it of fs.readdirSync(src)) {
              copyRnghHeaders(path.join(src, it), path.join(dst, it));
            }
          } else {
            fs.copyFileSync(src, dst);
          }
        }
        if (fs.existsSync(srcRngh)) {
          copyRnghHeaders(srcRngh, dstPublicRngh);
          copyRnghHeaders(srcRngh, dstPrivateRngh);
          log(`Mirrored rngesturehandler_codegen generated headers for ${platform.platformName}`);
        }

        const publicReact = path.join(platform.publicHeaders, 'ReactCodegen', 'react', 'renderer', 'components');
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
        copyTreeIfExists(path.join(platform.privateHeaders, 'ReactCodegen', 'react', 'renderer', 'components'), publicReact);
        log(`Mirrored react/renderer component headers into Public ReactCodegen include tree for ${platform.platformName}`, publicReact);
      }
    }
  } catch (err) {
    console.warn('[apply-react-native-worklets-patch] copying generated headers failed:', err && err.message);
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
patchGestureHandlerForApple(gestureHandlerPkgDir);
patchScreensEdgeToEdgeForAndroid(screensPkgDir);
