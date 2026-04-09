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
  console.log('[patch-lucide-react-native]', ...args);
}

function patchFile(target, replacements) {
  const source = fs.readFileSync(target, 'utf8');
  const helperSnippet = `const normalizeNumericSvgProp = (value) => typeof value === 'string' && /^-?\\d+(?:\\.\\d+)?$/.test(value) ? Number(value) : value;`;
  const helperCount = source.split(helperSnippet).length - 1;

  if (
    helperCount === 1 &&
    source.includes('const normalizedSize = normalizeNumericSvgProp(size);') &&
    source.includes('width: normalizedSize,') &&
    source.includes('height: normalizedSize,')
  ) {
    log('Already patched', target);
    return false;
  }

  let next = source;

  for (const [from, to] of replacements) {
    next = next.replace(from, to);
  }

  if (helperCount > 1) {
    let firstHelperSeen = false;
    next = next
      .split('\n')
      .filter((line) => {
        if (line !== helperSnippet) {
          return true;
        }

        if (!firstHelperSeen) {
          firstHelperSeen = true;
          return true;
        }

        return false;
      })
      .join('\n');
  }

  if (next === source) {
    log('Already patched', target);
    return false;
  }

  fs.writeFileSync(target, next, 'utf8');
  log('Patched', target);
  return true;
}

const esmTarget = findInstalledFile(
  path.resolve(__dirname),
  path.join('node_modules', 'lucide-react-native', 'dist', 'esm', 'Icon.js')
);
const cjsTarget = findInstalledFile(
  path.resolve(__dirname),
  path.join('node_modules', 'lucide-react-native', 'dist', 'cjs', 'Icon.js')
);

const esmReplacements = [
  [
    `import defaultAttributes, { childDefaultAttributes } from './defaultAttributes.js';\n`,
    `import defaultAttributes, { childDefaultAttributes } from './defaultAttributes.js';\n\nconst normalizeNumericSvgProp = (value) => typeof value === 'string' && /^-?\\d+(?:\\.\\d+)?$/.test(value) ? Number(value) : value;\n`
  ],
  [
    `  }, ref) => {\n    const customAttrs = {\n      stroke: color,\n      strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,\n      ...rest\n    };\n`,
    `  }, ref) => {\n    const normalizedSize = normalizeNumericSvgProp(size);\n    const normalizedStrokeWidth = normalizeNumericSvgProp(strokeWidth);\n    const normalizedRest = Object.fromEntries(\n      Object.entries(rest).map(([key, value]) => [key, normalizeNumericSvgProp(value)])\n    );\n    const customAttrs = {\n      stroke: color,\n      strokeWidth: absoluteStrokeWidth ? Number(normalizedStrokeWidth) * 24 / Number(normalizedSize) : normalizedStrokeWidth,\n      ...normalizedRest\n    };\n`
  ],
  [
    `        width: size,\n        height: size,\n`,
    `        width: normalizedSize,\n        height: normalizedSize,\n`
  ]
];

const cjsReplacements = [
  [
    `var defaultAttributes = require('./defaultAttributes.js');\n`,
    `var defaultAttributes = require('./defaultAttributes.js');\n\nconst normalizeNumericSvgProp = (value) => typeof value === 'string' && /^-?\\d+(?:\\.\\d+)?$/.test(value) ? Number(value) : value;\n`
  ],
  [
    `  }, ref) => {\n    const customAttrs = {\n      stroke: color,\n      strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,\n      ...rest\n    };\n`,
    `  }, ref) => {\n    const normalizedSize = normalizeNumericSvgProp(size);\n    const normalizedStrokeWidth = normalizeNumericSvgProp(strokeWidth);\n    const normalizedRest = Object.fromEntries(\n      Object.entries(rest).map(([key, value]) => [key, normalizeNumericSvgProp(value)])\n    );\n    const customAttrs = {\n      stroke: color,\n      strokeWidth: absoluteStrokeWidth ? Number(normalizedStrokeWidth) * 24 / Number(normalizedSize) : normalizedStrokeWidth,\n      ...normalizedRest\n    };\n`
  ],
  [
    `        width: size,\n        height: size,\n`,
    `        width: normalizedSize,\n        height: normalizedSize,\n`
  ]
];

let changed = false;
if (esmTarget) changed = patchFile(esmTarget, esmReplacements) || changed;
if (cjsTarget) changed = patchFile(cjsTarget, cjsReplacements) || changed;
if (!esmTarget && !cjsTarget) {
  log('Targets not found');
  process.exit(1);
}
if (!changed) {
  log('Nothing changed');
}
