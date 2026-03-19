import type { ImageSourcePropType } from 'react-native';

export type BrandImageSource = ImageSourcePropType;

export const brandAssets = {
  poliveraiLogo: { uri: '/poliverai-logo.png' } as ImageSourcePropType,
  poliveraiLogoSvg: { uri: '/poliverai-logo.svg' } as ImageSourcePropType,
  poliveraiIcon: { uri: '/poliverai-icon.svg' } as ImageSourcePropType,
  poliveraiIconTransparent: { uri: '/poliverai-icon-transparent.svg' } as ImageSourcePropType,
  andelaLogo: { uri: '/andela-logo-transparent.png' } as ImageSourcePropType,
};

export default brandAssets;

export type BrandAssets = typeof brandAssets;
