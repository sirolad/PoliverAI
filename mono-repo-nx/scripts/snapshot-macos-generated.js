const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Destination root for snapshots. For macOS we keep a dedicated
// `patches/macos-generated` folder because the macOS Podfile checks for
// `patches/macos-generated/ios` when copying pre-generated artifacts.
const destRoot = path.resolve(__dirname, '..', 'patches', 'macos-generated');

// We support multiple source paths to snapshot across macOS, iOS and Android.
// Each entry maps a source path and the destination subfolder name beneath destRoot.
const sources = [
  // macOS generated code and pod artifacts
  // The macOS build generates iOS-compatible codegen artifacts under
  // apps/poliverai/macos/build/generated/ios. The Podfile expects these to
  // live under patches/macos-generated/ios so name the destination `ios`.
  {
    name: 'ios',
    src: path.resolve(__dirname, '..', 'apps', 'poliverai', 'macos', 'build', 'generated', 'ios')
  },
  {
    name: 'macos/pod-ReactCodegen',
    src: path.resolve(__dirname, '..', 'apps', 'poliverai', 'macos', 'Pods', 'Local Podspecs', 'ReactCodegen.podspec.json')
  },
  {
    name: 'macos/pods-pbxproj',
    src: path.resolve(__dirname, '..', 'apps', 'poliverai', 'macos', 'Pods', 'Pods.xcodeproj', 'project.pbxproj')
  },
  {
    name: 'macos/pods-build-scripts',
    src: path.resolve(__dirname, '..', 'apps', 'poliverai', 'macos', 'build', 'Pods.build')
  },

  // iOS generated code and Pod artifacts (if an iOS build was produced locally)
  {
    name: 'ios/ios-generated',
    src: path.resolve(__dirname, '..', 'apps', 'poliverai', 'ios', 'build', 'generated', 'ios')
  },
  {
    name: 'ios/pod-ReactCodegen',
    src: path.resolve(__dirname, '..', 'apps', 'poliverai', 'ios', 'Pods', 'Local Podspecs', 'ReactCodegen.podspec.json')
  },
  {
    name: 'ios/pods-pbxproj',
    src: path.resolve(__dirname, '..', 'apps', 'poliverai', 'ios', 'Pods', 'Pods.xcodeproj', 'project.pbxproj')
  },

  // Android Gradle generated outputs (if produced locally)
  {
    name: 'android/gradle-generated',
    src: path.resolve(__dirname, '..', 'apps', 'poliverai', 'android', 'app', 'build')
  },
  {
    name: 'android/gradle-wrapper',
    src: path.resolve(__dirname, '..', 'apps', 'poliverai', 'android', 'gradle')
  }
];

async function copyRecursive(src, dest) {
  const s = await stat(src);
  if (s.isDirectory()) {
    await mkdir(dest, { recursive: true });
    const items = await readdir(src);
    for (const it of items) {
      await copyRecursive(path.join(src, it), path.join(dest, it));
    }
  } else {
    await mkdir(path.dirname(dest), { recursive: true });
    await copyFile(src, dest);
  }
}

async function main() {
  for (const entry of sources) {
    const srcRoot = entry.src;
    const destSub = entry.name;
    if (!fs.existsSync(srcRoot)) {
      console.warn(`Source path not found (skipping): ${srcRoot}`);
      continue;
    }
    const dest = path.join(destRoot, destSub);
    const s = fs.statSync(srcRoot);
    if (s.isDirectory()) {
      await copyRecursive(srcRoot, dest);
    } else {
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(srcRoot, dest);
    }
    console.log(`Copied ${srcRoot} -> ${dest}`);
  }
  console.log(`Snapshot written to ${destRoot}`);
}

main().catch(e => { console.error(e); process.exit(1); });
