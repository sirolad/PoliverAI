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
  console.log('[patch-lottie-react-native]', ...args);
}

const target = findInstalledFile(
  path.resolve(__dirname),
  path.join(
    'node_modules',
    'lottie-react-native',
    'android',
    'src',
    'main',
    'java',
    'com',
    'airbnb',
    'android',
    'react',
    'lottie',
    'LottieAnimationViewPropertyManager.kt'
  )
);

if (!target) {
  log('Target file not found, skipping');
  process.exit(0);
}

const source = fs.readFileSync(target, 'utf8');

if (source.includes('current?.getString("find")')) {
  log('Already patched');
  process.exit(0);
}

let next = source;
next = next.replace(
  `                    val current = textFilters!!.getMap(i)
                    val searchText = current.getString("find")
                    val replacementText = current.getString("replace")
                    textDelegate.setText(searchText, replacementText)`,
  `                    val current = textFilters!!.getMap(i)
                    val searchText = current?.getString("find")
                    val replacementText = current?.getString("replace")
                    if (searchText != null && replacementText != null) {
                        textDelegate.setText(searchText, replacementText)
                    }`
);

next = next.replace(
  `                    val current = colorFilters.getMap(i)
                    parseColorFilter(current, view)`,
  `                    val current = colorFilters.getMap(i)
                    if (current != null) {
                        parseColorFilter(current, view)
                    }`
);

if (next === source) {
  log('Patch pattern not found, skipping');
  process.exit(0);
}

fs.writeFileSync(target, next, 'utf8');
log('Patched', target);
