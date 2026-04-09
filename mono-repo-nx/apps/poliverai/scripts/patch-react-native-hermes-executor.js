#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const target = path.resolve(
  __dirname,
  '../../../node_modules/react-native/ReactCommon/hermes/executor/HermesExecutorFactory.h'
);

if (!fs.existsSync(target)) {
  console.log('[patch-react-native-hermes-executor] Target not found, skipping.');
  process.exit(0);
}

const source = fs.readFileSync(target, 'utf8');
const original = `  jsinspector_modern::RuntimeTargetDelegate& getRuntimeTargetDelegate()\n      override;`;
const replacement = `  jsinspector_modern::RuntimeTargetDelegate& getRuntimeTargetDelegate();`;

if (source.includes(replacement)) {
  console.log('[patch-react-native-hermes-executor] Already patched.');
  process.exit(0);
}

if (!source.includes(original)) {
  console.error('[patch-react-native-hermes-executor] Expected source block not found.');
  process.exit(1);
}

fs.writeFileSync(target, source.replace(original, replacement));
console.log('[patch-react-native-hermes-executor] Patch applied.');
