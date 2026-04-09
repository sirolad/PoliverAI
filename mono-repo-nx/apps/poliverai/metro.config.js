const { getResolveRequest } = require('@nx/react-native/plugins/metro-resolver');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const metroResolver = require('metro-resolver');
const path = require('path');

const appRoot = __dirname;
const workspaceRoot = path.resolve(appRoot, '..', '..');
const defaultConfig = getDefaultConfig(appRoot);
const { assetExts, sourceExts } = defaultConfig.resolver;
const appNodeModules = path.resolve(appRoot, 'node_modules');
const rootNodeModules = path.resolve(workspaceRoot, 'node_modules');
const intlEntry = path.resolve(workspaceRoot, 'libs', 'intl', 'src', 'index.ts');
const sharedUiEntry = path.resolve(workspaceRoot, 'shared-ui', 'src', 'index.ts');
const sharedUiRoot = path.resolve(workspaceRoot, 'shared-ui', 'src');
const assetsEntry = path.resolve(appRoot, 'assets');
const nxResolveRequest = getResolveRequest(['cjs', 'mjs', 'svg']);

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

const customConfig = {
  projectRoot: appRoot,
  watchFolders: [workspaceRoot],
  cacheVersion: '@poliverai/poliverai',
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer/react-native'),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
    platforms: [...new Set([...(defaultConfig.resolver?.platforms || []), 'macos', 'windows'])],    blockList: [
      /apps[\\/]poliverai[\\/]windows[\\/]AppPackages[\\/].*/,
      /apps[\\/]poliverai[\\/]windows[\\/](x64|x86|ARM|ARM64|build)[\\/].*/,
    ],
    disableHierarchicalLookup: true,
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
    resolveRequest(context, moduleName, platform) {
      const aliasTarget = resolveWorkspaceAlias(moduleName);
      if (aliasTarget) {
        return {
          type: 'sourceFile',
          filePath: aliasTarget,
        };
      }

      try {
        return nxResolveRequest(context, moduleName, platform);
      } catch {
        return metroResolver.resolve(
          {
            ...context,
            resolveRequest: null,
          },
          moduleName,
          platform
        );
      }
    },
  },
};

module.exports = mergeConfig(defaultConfig, customConfig);
