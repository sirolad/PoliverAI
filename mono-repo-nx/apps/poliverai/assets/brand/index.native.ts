import type { ImageSourcePropType } from 'react-native';

export type BrandImageSource = ImageSourcePropType;

export const brandAssets = {
  poliveraiLogo: require('./poliverai-logo.png') as ImageSourcePropType,
  poliveraiLogoSvg: require('./poliverai-logo.svg') as ImageSourcePropType,
  poliveraiIcon: require('./poliverai-icon.svg') as ImageSourcePropType,
  poliveraiIconTransparent: require('./poliverai-icon-transparent.svg') as ImageSourcePropType,
  andelaLogo: require('./andela-logo-transparent.png') as ImageSourcePropType,
};

export default brandAssets;

export type BrandAssets = typeof brandAssets;
