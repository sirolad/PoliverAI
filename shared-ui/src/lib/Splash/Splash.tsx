/* eslint-disable @typescript-eslint/no-explicit-any */
// This file uses dynamic requires and relaxed typing because lottie and
// expo-splash-screen are optional native deps during early development.
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
const LottieView: any = require('lottie-react-native');
import * as SplashScreen from 'expo-splash-screen';
import assets from '@assets';

interface SplashProps {
  onFinish?: () => void;
  source?: unknown;
  duration?: number;
}

export const Splash: React.FC<SplashProps> = ({ onFinish, source, duration = 4000 }) => {
  const animRef = useRef<any>(null);

  useEffect(() => {
    // Prevent the native splash screen from auto-hiding
    SplashScreen.preventAutoHideAsync().catch((e: any) => {
      // ignore errors preventing auto hide on some platforms
      void e;
    });

    const timer = setTimeout(async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        // ignore errors hiding splash
      }
      if (typeof onFinish === 'function') onFinish();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* require the app asset at runtime */}
      <LottieView
        ref={animRef}
        source={(source as any) || (assets.lottieAnimations?.poliveraiSplash as any)}
        autoPlay
        loop={false}
        speed={0.95}
        style={styles.lottie}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  lottie: {
    width: '100%', 
    height: '100%'
  },
});

export default Splash;
