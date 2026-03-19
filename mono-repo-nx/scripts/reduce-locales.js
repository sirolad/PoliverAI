const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const localesPath = path.join(root, 'libs', 'intl', 'src', 'locales', 'en-US.json');
const outPath = path.join(root, 'libs', 'intl', 'src', 'locales', 'en-US.reduced.json');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (/\.tsx?$/.test(file)) {
      results.push(filePath);
    }
  });
  return results;
}

function extractKeysFromFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const keys = new Set();
  const regexes = [ /t\(['`\"]([a-zA-Z0-9_.\-]+)['`\"]/g, /useTranslation\(\)\.t\(['`\"]([a-zA-Z0-9_.\-]+)['`\"]/g, /t\(`([^`]+)`/g ];
  for (const rx of regexes) {
    let m;
    while ((m = rx.exec(text)) !== null) {
      keys.add(m[1]);
    }
  }
  return Array.from(keys);
}

function setDeep(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i === parts.length - 1) {
      cur[p] = value;
    } else {
      if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
      cur = cur[p];
    }
  }
}

function getDeep(obj, keyPath) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

const files = walk(root);
const keys = new Set();
for (const f of files) {
  const k = extractKeysFromFile(f);
  k.forEach(x => keys.add(x));
}

console.log('Found keys:', keys.size);
const full = JSON.parse(fs.readFileSync(localesPath, 'utf8'));
const reduced = {};
for (const key of keys) {
  const v = getDeep(full, key);
  if (v !== undefined) setDeep(reduced, key, v);
}

fs.writeFileSync(outPath, JSON.stringify(reduced, null, 2), 'utf8');
console.log('Wrote reduced locale to', outPath);
