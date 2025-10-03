// Sub-index for brand assets
// Support both React Native (Metro) which expects `require()` for assets
// and ESM web bundlers (Vite) where `require` is not defined. Use a
// conditional resolution so the same API can be imported from '@assets/brand'.
import type { ImageSourcePropType } from 'react-native';

function loadAsset(path: string): ImageSourcePropType {
  const maybeRequire = (globalThis as unknown as { require?: (p: string) => unknown }).require;
  if (typeof maybeRequire === 'function') {
    return maybeRequire(path) as ImageSourcePropType;
  }

  try {
    const url = new URL(path, import.meta.url).href;
    return { uri: url } as ImageSourcePropType;
  } catch {
    return { uri: path } as ImageSourcePropType;
  }
}

export const brandAssets = {
  poliveraiLogo: loadAsset('./poliverai-logo.svg'),
  poliveraiIcon: loadAsset('./poliverai-icon.svg'),
  poliveraiIconTransparent: loadAsset('./poliverai-icon-transparent.svg'),
};

export default brandAssets;

export type BrandAssets = typeof import('./index');
