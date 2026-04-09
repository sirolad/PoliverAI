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

function dedupeLines(block) {
  const seen = new Set();
  return block
    .split('\n')
    .filter((line) => {
      if (line === '') {
        return true;
      }
      if (seen.has(line)) {
        return false;
      }
      seen.add(line);
      return true;
    })
    .join('\n');
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
    const composeImportBlock = `import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.ComposeView
`;

    next = next
      .replace(
        /import androidx\.compose\.foundation\.layout\.Box\nimport androidx\.compose\.foundation\.layout\.fillMaxSize\nimport androidx\.compose\.ui\.Alignment\nimport androidx\.compose\.ui\.Modifier\nimport androidx\.compose\.foundation\.layout\.Box\nimport androidx\.compose\.foundation\.layout\.fillMaxSize\nimport androidx\.compose\.ui\.Alignment\nimport androidx\.compose\.ui\.Modifier\nimport androidx\.compose\.ui\.platform\.ComposeView\n/,
        composeImportBlock
      )
      .replace(
        /import androidx\.compose\.ui\.platform\.ComposeView\n/,
        composeImportBlock
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

    next = next.replace(
      /import androidx\.compose\.foundation\.layout\.Box\nimport androidx\.compose\.foundation\.layout\.fillMaxSize\nimport androidx\.compose\.ui\.Alignment\nimport androidx\.compose\.ui\.Modifier\nimport androidx\.compose\.foundation\.layout\.Box\nimport androidx\.compose\.foundation\.layout\.fillMaxSize\nimport androidx\.compose\.ui\.Alignment\nimport androidx\.compose\.ui\.Modifier\nimport androidx\.compose\.ui\.platform\.ComposeView\n/g,
      composeImportBlock
    );

    const packageLine = 'package com.dotlottiereactnative\n\n';
    if (next.startsWith(packageLine)) {
      const rest = next.slice(packageLine.length);
      const importEnd = rest.indexOf('\n\n');
      if (importEnd !== -1) {
        const importSection = rest.slice(0, importEnd);
        const remaining = rest.slice(importEnd);
        next = packageLine + dedupeLines(importSection) + remaining;
      }
    }
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
