// Central asset index for apps/poliverai
// Export grouped asset objects so consumers can import from '@assets'
import lottieAnimations from './lottie-animations';

export { lottieAnimations };

export default {
  lottieAnimations,
};

export type Assets = typeof import('./index');
