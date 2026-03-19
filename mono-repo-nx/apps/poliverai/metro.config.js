const { withNxMetro } = require('@nx/react-native');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const metroResolver = require('metro-resolver');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;
const workspaceRoot = path.resolve(__dirname, '..', '..');
const appNodeModules = path.resolve(__dirname, 'node_modules');
const rootNodeModules = path.resolve(workspaceRoot, 'node_modules');
const intlEntry = path.resolve(workspaceRoot, 'libs', 'intl', 'src', 'index.ts');
const sharedUiEntry = path.resolve(workspaceRoot, 'shared-ui', 'src', 'index.ts');
const sharedUiRoot = path.resolve(workspaceRoot, 'shared-ui', 'src');
const assetsEntry = path.resolve(__dirname, 'assets');

function resolveWorkspaceAlias(moduleName) {
  if (moduleName === '@shared-ui') return sharedUiEntry;
  if (moduleName.startsWith('@shared-ui/')) {
    return path.resolve(sharedUiRoot, moduleName.slice('@shared-ui/'.length));
  }
  if (moduleName === '@poliverai/intl') return intlEntry;
  if (moduleName === '@poliverai/shared-ui') return sharedUiEntry;
  if (moduleName === '@assets') return path.resolve(assetsEntry, 'index.ts');
  if (moduleName === '@assets/brand') return path.resolve(assetsEntry, 'brand', 'index.ts');
  if (moduleName.startsWith('@assets/')) {
    return path.resolve(assetsEntry, moduleName.slice('@assets/'.length));
  }
  return null;
}

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const customConfig = {
  cacheVersion: '@poliverai/poliverai',
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer/react-native'),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    // ensure we resolve common module extensions and svg
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
    // add macos/windows platforms so metro can resolve platform-specific files like *.windows.js / *.macos.js
    platforms: [...(defaultConfig.resolver?.platforms || []), 'macos', 'windows'],
    nodeModulesPaths: [appNodeModules, rootNodeModules],
    unstable_enableSymlinks: true,
    extraNodeModules: new Proxy(
      {},
      {
        get: (_, name) => {
          if (name === '@shared-ui') return sharedUiEntry;
          if (name === '@poliverai/intl') return intlEntry;
          if (name === '@poliverai/shared-ui') return sharedUiEntry;
          return path.join(rootNodeModules, name);
        },
      }
    ),
  },
};

module.exports = (async () => {
  const nxConfig = await withNxMetro(mergeConfig(defaultConfig, customConfig), {
    // Change this to true to see debugging info.
    // Useful if you have issues resolving modules
    debug: false,
    // all the file extensions used for imports other than 'ts', 'tsx', 'js', 'jsx', 'json'
    extensions: [],
    // Specify folders to watch, in addition to Nx defaults (workspace libraries and node_modules)
    watchFolders: [
      __dirname,
      appNodeModules,
      rootNodeModules,
      // workspace root so Metro can resolve workspaces/libs
      workspaceRoot,
      // shared-ui source folder (explicit)
      path.resolve(workspaceRoot, 'shared-ui', 'src'),
      path.resolve(workspaceRoot, 'libs', 'intl', 'src'),
    ],
  });

  const fallbackResolveRequest = nxConfig.resolver?.resolveRequest;

  return mergeConfig(nxConfig, {
    projectRoot: __dirname,
    resolver: {
      nodeModulesPaths: [appNodeModules, rootNodeModules],
      unstable_enableSymlinks: true,
      resolveRequest(context, moduleName, platform) {
        const aliasTarget = resolveWorkspaceAlias(moduleName);
        if (aliasTarget) {
          return {
            type: 'sourceFile',
            filePath: aliasTarget,
          };
        }

        if (fallbackResolveRequest) {
          return fallbackResolveRequest(context, moduleName, platform);
        }

        return metroResolver.resolve(
          {
            ...context,
            resolveRequest: null,
          },
          moduleName,
          platform
        );
      },
    },
  });
})();
