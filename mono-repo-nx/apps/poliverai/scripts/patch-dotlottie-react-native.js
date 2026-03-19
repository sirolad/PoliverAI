#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function findInstalledFile(startDir, relativePath) {
  let dir = startDir;
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, relativePath);
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function log(...args) {
  console.log('[patch-dotlottie-react-native]', ...args);
}

const targets = [
  path.join(
    'node_modules',
    '@lottiefiles',
    'dotlottie-react-native',
    'android',
    'src',
    'main',
    'java',
    'com',
    'dotlottiereactnative',
    'DotlottieReactNativePackage.kt'
  ),
  path.join(
    'node_modules',
    '@lottiefiles',
    'dotlottie-react-native',
    'android',
    'src',
    'main',
    'java',
    'com',
    'dotlottiereactnative',
    'DotlottieReactNativeViewManager.kt'
  ),
  path.join(
    'node_modules',
    '@lottiefiles',
    'dotlottie-react-native',
    'android',
    'src',
    'main',
    'java',
    'com',
    'dotlottiereactnative',
    'DotlottieReactNativeView.kt'
  ),
];

let changed = false;

for (const relativePath of targets) {
  const target = findInstalledFile(path.resolve(__dirname), relativePath);
  if (!target) {
    log('Target file not found, skipping', relativePath);
    continue;
  }

  const source = fs.readFileSync(target, 'utf8');
  let next = source
    .replace(/^import com\.facebook\.react\.common\.annotations\.internal\.InteropLegacyArchitecture\s*\n/m, '')
    .replace(/^@InteropLegacyArchitecture\s*\n/m, '');

  if (target.endsWith('DotlottieReactNativeView.kt')) {
    next = next
      .replace(
        /import androidx\.compose\.foundation\.layout\.Box\nimport androidx\.compose\.foundation\.layout\.fillMaxSize\nimport androidx\.compose\.ui\.Alignment\nimport androidx\.compose\.ui\.Modifier\nimport androidx\.compose\.foundation\.layout\.Box\nimport androidx\.compose\.foundation\.layout\.fillMaxSize\nimport androidx\.compose\.ui\.Alignment\nimport androidx\.compose\.ui\.Modifier\nimport androidx\.compose\.ui\.platform\.ComposeView\n/,
        `import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
`
      )
      .replace(
        /import androidx\.compose\.ui\.platform\.ComposeView\n/,
        `import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
`
      )
      .replace(
        '  private fun renderContent() {\n    composeView.setContent { DotLottieContent() }\n    hasActiveComposition = true\n  }\n',
        `  private fun renderContent() {
    composeView.setContent {
      Box(
              modifier = Modifier.fillMaxSize(),
              contentAlignment = Alignment.Center
      ) {
        DotLottieContent()
      }
    }
    hasActiveComposition = true
  }
`
      )
      .replace(
        '      DotLottieAnimation(\n              source = DotLottieSource.Url(url),\n',
        `      DotLottieAnimation(
              modifier = Modifier.fillMaxSize(),
              source = DotLottieSource.Url(url),
`
      )
      .replace(
        /modifier = Modifier\.fillMaxSize\(\),\n\s*modifier = Modifier\.fillMaxSize\(\),\n/g,
        'modifier = Modifier.fillMaxSize(),\n'
      );
  }

  if (next === source) {
    log('Already patched', target);
    continue;
  }

  fs.writeFileSync(target, next, 'utf8');
  log('Patched', target);
  changed = true;
}

if (!changed) {
  log('Nothing changed');
}
