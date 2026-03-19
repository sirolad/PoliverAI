#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const LINKED_PACKAGES = [
  'react',
  'react-native',
  '@react-native-async-storage/async-storage',
  'react-native-bootsplash',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-svg',
  'nativewind',
  'react-native-css-interop',
  '@poliverai/shared-ui',
  '@poliverai/intl',
];

const WORKSPACE_PACKAGE_DIRS = {
  '@poliverai/shared-ui': 'shared-ui',
  '@poliverai/intl': path.join('libs', 'intl'),
};

function ensureFileContents(filePath, contents) {
  if (fs.existsSync(filePath)) {
    const current = fs.readFileSync(filePath, 'utf8');
    if (current === contents) {
      return false;
    }
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, 'utf8');
  return true;
}

function patchReactNativeCssInteropPackage({ repoRoot }) {
  const packageRoot = path.join(repoRoot, 'node_modules', 'react-native-css-interop');
  if (!fs.existsSync(packageRoot)) {
    return false;
  }

  const shims = [
    {
      file: path.join(packageRoot, 'jsx-runtime.js'),
      target: './dist/runtime/jsx-runtime.js',
    },
    {
      file: path.join(packageRoot, 'jsx-dev-runtime.js'),
      target: './dist/runtime/jsx-dev-runtime.js',
    },
  ];

  let changed = false;

  for (const shim of shims) {
    const contents = `module.exports = require(${JSON.stringify(shim.target)});\n`;
    changed = ensureFileContents(shim.file, contents) || changed;
  }

  return changed;
}

function writeReactNativeCssInteropStub({ repoRoot, appRoot, packageName }) {
  const source = path.join(repoRoot, 'node_modules', packageName);
  const dest = path.join(appRoot, 'node_modules', packageName);
  const packageJsonPath = path.join(source, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const rewritten = {
    ...pkg,
    main: './index.js',
    module: './index.js',
    'react-native': './index.js',
    exports: {
      '.': {
        default: './index.js',
      },
      './jsx-runtime': {
        default: './jsx-runtime.js',
      },
      './jsx-dev-runtime': {
        default: './jsx-dev-runtime.js',
      },
      './package.json': './package.json',
    },
  };

  const relativeDist = path.relative(dest, path.join(source, 'dist')).replace(/\\/g, '/');
  const relativePackageJson = path.relative(dest, packageJsonPath).replace(/\\/g, '/');

  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, 'package.json'), JSON.stringify(rewritten, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(dest, 'index.js'), `module.exports = require("./dist/index.js");\n`, 'utf8');
  fs.writeFileSync(
    path.join(dest, 'jsx-runtime.js'),
    `module.exports = require("./dist/runtime/jsx-runtime.js");\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(dest, 'jsx-dev-runtime.js'),
    `module.exports = require("./dist/runtime/jsx-dev-runtime.js");\n`,
    'utf8'
  );
  fs.symlinkSync(relativeDist, path.join(dest, 'dist'), 'dir');
  fs.writeFileSync(
    path.join(dest, 'upstream-package.json'),
    fs.readFileSync(relativePackageJson.startsWith('.') ? packageJsonPath : packageJsonPath, 'utf8'),
    'utf8'
  );
  return true;
}

function writeWorkspacePackageStub({ repoRoot, appRoot, packageName, source }) {
  const dest = path.join(appRoot, 'node_modules', packageName);
  const packageJsonPath = path.join(source, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const rewritten = { ...pkg };
  const sourceMain =
    (typeof pkg['react-native'] === 'string' && pkg['react-native']) ||
    (typeof pkg.main === 'string' && pkg.main) ||
    'src/index.ts';
  const sourceTypes =
    (typeof pkg.types === 'string' && pkg.types) ||
    sourceMain;
  const relativeMain = path.relative(dest, path.join(source, sourceMain)).replace(/\\/g, '/');
  const relativeTypes = path.relative(dest, path.join(source, sourceTypes)).replace(/\\/g, '/');
  const shimPath = './index.js';

  rewritten.main = shimPath;
  rewritten.module = shimPath;
  rewritten['react-native'] = shimPath;
  rewritten.types = relativeTypes;
  rewritten.exports = {
    '.': {
      types: relativeTypes,
      import: shimPath,
      default: shimPath,
    },
    './package.json': './package.json',
  };

  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, 'package.json'), JSON.stringify(rewritten, null, 2) + '\n', 'utf8');
  fs.writeFileSync(
    path.join(dest, 'index.js'),
    `module.exports = require(${JSON.stringify(relativeMain)});\n`,
    'utf8'
  );
  return true;
}

function getPackageSource(repoRoot, packageName) {
  const workspaceDir = WORKSPACE_PACKAGE_DIRS[packageName];
  if (workspaceDir) {
    return path.join(repoRoot, workspaceDir);
  }

  return path.join(repoRoot, 'node_modules', packageName);
}

function ensureHoistedModuleLink({ repoRoot, appRoot, packageName, onSkip } = {}) {
  const source = getPackageSource(repoRoot, packageName);
  const dest = path.join(appRoot, 'node_modules', packageName);
  const workspaceDir = WORKSPACE_PACKAGE_DIRS[packageName];

  if (!fs.existsSync(source)) {
    if (onSkip) {
      onSkip(packageName, source);
    }
    return false;
  }

  if (workspaceDir) {
    return writeWorkspacePackageStub({ repoRoot, appRoot, packageName, source });
  }

  if (packageName === 'react-native-css-interop') {
    return writeReactNativeCssInteropStub({ repoRoot, appRoot, packageName });
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const expected = path.relative(path.dirname(dest), source);

  try {
    const stat = fs.lstatSync(dest);
    if (stat.isSymbolicLink()) {
      const current = fs.readlinkSync(dest);
      if (current === expected) {
        return false;
      }
      fs.unlinkSync(dest);
    } else {
      fs.rmSync(dest, { recursive: true, force: true });
    }
  } catch (_) {
    // destination missing, create it below
  }

  fs.symlinkSync(expected, dest, 'dir');
  return true;
}

function ensureAppHoistedLinks({ repoRoot, appRoot, packages = LINKED_PACKAGES, logPrefix = '' } = {}) {
  const linkedPackages = [];
  const patchedCssInterop = patchReactNativeCssInteropPackage({ repoRoot });

  if (patchedCssInterop && logPrefix) {
    console.log(`${logPrefix}: patched react-native-css-interop jsx runtime shims`);
  }

  for (const packageName of packages) {
    const linked = ensureHoistedModuleLink({
      repoRoot,
      appRoot,
      packageName,
      onSkip: (name, source) => {
        if (logPrefix) {
          console.warn(`${logPrefix}: hoisted package not found, skipping ${name} (${source})`);
        }
      },
    });

    if (linked) {
      linkedPackages.push(packageName);
      if (logPrefix) {
        console.log(`${logPrefix}: linked ${packageName} into app node_modules`);
      }
    }
  }

  return linkedPackages;
}

if (require.main === module) {
  const repoRoot = path.resolve(__dirname, '..');
  const appRoot = path.join(repoRoot, 'apps', 'poliverai');
  ensureAppHoistedLinks({
    repoRoot,
    appRoot,
    logPrefix: 'ensure-app-hoisted-links',
  });
}

module.exports = {
  LINKED_PACKAGES,
  ensureAppHoistedLinks,
  ensureHoistedModuleLink,
};
