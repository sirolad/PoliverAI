import { Platform, type ImageSourcePropType } from 'react-native';

function webAsset(uri: string): ImageSourcePropType {
  return { uri } as ImageSourcePropType;
}

export const landingBrandAssets = {
  poliveraiLogo:
    Platform.OS === 'web'
      ? webAsset('/poliverai-logo.png')
      : (require('../../../apps/poliverai/public/poliverai-logo.png') as ImageSourcePropType),
  andelaLogo:
    Platform.OS === 'web'
      ? webAsset('/andela-logo-transparent.png')
      : (require('../../../apps/poliverai/public/andela-logo-transparent.png') as ImageSourcePropType),
} as const;

export const teamMemberAssets = {
  1: Platform.OS === 'web' ? webAsset('/team-members/2.png') : (require('../../../apps/poliverai/public/team-members/2.png') as ImageSourcePropType),
  2: Platform.OS === 'web' ? webAsset('/team-members/1.jpeg') : (require('../../../apps/poliverai/public/team-members/1.jpeg') as ImageSourcePropType),
  3: Platform.OS === 'web' ? webAsset('/team-members/3.png') : (require('../../../apps/poliverai/public/team-members/3.png') as ImageSourcePropType),
  4: Platform.OS === 'web' ? webAsset('/team-members/4.jpg') : (require('../../../apps/poliverai/public/team-members/4.jpg') as ImageSourcePropType),
  5: Platform.OS === 'web' ? webAsset('/team-members/5.jpg') : (require('../../../apps/poliverai/public/team-members/5.jpg') as ImageSourcePropType),
  6: Platform.OS === 'web' ? webAsset('/team-members/6.jpg') : (require('../../../apps/poliverai/public/team-members/6.jpg') as ImageSourcePropType),
  7: Platform.OS === 'web' ? webAsset('/team-members/7.png') : (require('../../../apps/poliverai/public/team-members/7.png') as ImageSourcePropType),
  8: Platform.OS === 'web' ? webAsset('/team-members/8.png') : (require('../../../apps/poliverai/public/team-members/8.png') as ImageSourcePropType),
  9: Platform.OS === 'web' ? webAsset('/team-members/9.png') : (require('../../../apps/poliverai/public/team-members/9.png') as ImageSourcePropType),
  10: Platform.OS === 'web' ? webAsset('/team-members/10.jpg') : (require('../../../apps/poliverai/public/team-members/10.jpg') as ImageSourcePropType),
  11: Platform.OS === 'web' ? webAsset('/team-members/11.png') : (require('../../../apps/poliverai/public/team-members/11.png') as ImageSourcePropType),
  12: Platform.OS === 'web' ? webAsset('/team-members/12.jpg') : (require('../../../apps/poliverai/public/team-members/12.jpg') as ImageSourcePropType),
  13: Platform.OS === 'web' ? webAsset('/team-members/13.jpg') : (require('../../../apps/poliverai/public/team-members/13.jpg') as ImageSourcePropType),
} as const;
