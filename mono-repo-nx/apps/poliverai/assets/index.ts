// Central asset index for apps/poliverai
// Export grouped asset objects so consumers can import from '@assets'
import lottieAnimations from './lottie-animations';
import { brandAssets } from './brand';

export { lottieAnimations };
export { brandAssets };

export default {
  lottieAnimations,
  brandAssets,
};

export type Assets = typeof import('./index');
