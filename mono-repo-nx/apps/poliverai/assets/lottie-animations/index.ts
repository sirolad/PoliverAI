// Sub-index for lottie animation assets
export const lottieAnimations = {
  poliveraiSplash: require('./poliverai-splash.json'),
  poliveraiLogoAnimated: require('./poliverai-logo-animated.json'),
};

export default lottieAnimations;

export type LottieAnimations = typeof import('./index');
