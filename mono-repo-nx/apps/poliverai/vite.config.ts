import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..', '..', '..');

const extensions = [
  '.mjs',
  '.web.tsx',
  '.tsx',
  '.web.ts',
  '.ts',
  '.web.jsx',
  '.jsx',
  '.web.js',
  '.js',
  '.css',
  '.json',
];

const rollupPlugin = (matchers: RegExp[]) => ({
  name: 'js-in-jsx',
  load(id: string) {
    if (matchers.some((matcher) => matcher.test(id)) && id.endsWith('.js')) {
      const file = readFileSync(id, { encoding: 'utf-8' });
      return esbuild.transformSync(file, { loader: 'jsx', jsx: 'automatic' });
    }
  },
});

export default {
  root: __dirname,
  publicDir: path.resolve(__dirname, 'public'),
  cacheDir: '../../node_modules/.vite/apps/poliverai',
  define: {
    global: 'window',
  },
  resolve: {
    extensions,
    alias: [
      { find: 'react-native', replacement: 'react-native-web' },
      { find: 'react-native-svg', replacement: 'react-native-svg-web' },
      {
        find: '@react-native/assets-registry/registry',
        replacement: 'react-native-web/dist/modules/AssetRegistry/index',
      },
      { find: '@assets', replacement: require('path').resolve(__dirname, 'assets') },
    ],
  },
  build: {
    reportCompressedSize: true,
    commonjsOptions: { transformMixedEsModules: true },
    outDir: '../../dist/apps/poliverai/web',
    rollupOptions: {
      plugins: [rollupPlugin([/react-native-vector-icons/])],
    },
  },
  server: {
    port: 4200,
    host: 'localhost',
    fs: {
      allow: [repoRoot],
    },
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  optimizeDeps: {
    esbuildOptions: {
      resolveExtensions: extensions,
      jsx: 'automatic',
      loader: { '.js': 'jsx' },
    },
  },
  plugins: [nxViteTsPaths()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
};
