const { withNxMetro } = require('@nx/react-native');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const customConfig = {
  cacheVersion: '@poliverai/poliverai',
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    // ensure we resolve common module extensions and svg
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
    // add macos/windows platforms so metro can resolve platform-specific files like *.windows.js / *.macos.js
    platforms: [...(defaultConfig.resolver?.platforms || []), 'macos', 'windows'],
    alias: {
      // Resolve @assets to the app assets folder so imports like @assets/.. work in RN
      '@assets': require('path').resolve(__dirname, 'assets'),
    },
  },
};

module.exports = withNxMetro(mergeConfig(defaultConfig, customConfig), {
  // Change this to true to see debugging info.
  // Useful if you have issues resolving modules
  debug: false,
  // all the file extensions used for imports other than 'ts', 'tsx', 'js', 'jsx', 'json'
  extensions: [],
  // Specify folders to watch, in addition to Nx defaults (workspace libraries and node_modules)
  watchFolders: [
    // workspace root so Metro can resolve workspaces/libs
    require('path').resolve(__dirname, '..', '..'),
    // shared-ui source folder (explicit)
    require('path').resolve(__dirname, '..', '..', 'shared-ui', 'src')
  ],
});
