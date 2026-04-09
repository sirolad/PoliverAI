/* eslint-disable @typescript-eslint/no-explicit-any */
import { Platform } from 'react-native';

export const POLIVERAI_SPLASH_DOTLOTTIE_URL =
  'https://lottie.host/60d101b5-d7e9-4e51-8c0c-2624f51e642a/sGDt58V29f.lottie';

const splashModule: any =
  Platform.OS === 'web'
    ? require('./Splash.web')
    : Platform.OS === 'macos'
      ? require('./Splash.macos')
      : require('./Splash.native');

export const Splash = splashModule.Splash;

export default splashModule.default ?? splashModule.Splash;
