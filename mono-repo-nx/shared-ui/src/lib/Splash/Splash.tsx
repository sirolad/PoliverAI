/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared splash component that avoids static, native-only imports so it can be
// used by both web (Vite) and React Native. Do not import Expo or app assets
// from here. A calling app should pass a `source` prop for the animation.
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface SplashProps {
  onFinish?: () => void;
  source?: unknown;
  duration?: number;
}

// Runtime guard helpers
const isWeb = typeof globalThis !== 'undefined' && typeof (globalThis as any).document !== 'undefined';
const isReactNative = !isWeb;

const tryRequire = (name: string) => {
  try {
    // Use eval to avoid static analysis by web bundlers.
    // eslint-disable-next-line no-eval, @typescript-eslint/no-implied-eval
    // @ts-ignore
    return eval('require')(name);
  } catch (e) {
    return null;
  }
};

const LottieView: any = isReactNative ? tryRequire('lottie-react-native') : null;

export const Splash: React.FC<SplashProps> = ({ onFinish, source, duration = 4000 }) => {
  const animRef = useRef<any>(null);

  useEffect(() => {
    // Simple in-app splash timing; do not call any Expo/native API here.
    const timer = setTimeout(() => {
      if (typeof onFinish === 'function') onFinish();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  // If Lottie is available (native), render it. Otherwise render a simple web fallback.
  if (LottieView) {
    return (
      <View style={styles.container} pointerEvents="none">
        <LottieView
          ref={animRef}
          source={(source as any) || undefined}
          autoPlay
          loop={false}
          speed={0.95}
          style={styles.lottie}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Web / fallback rendering
  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.brand}>PoliverAI</Text>
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
    height: '100%',
  },
  brand: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
});

export default Splash;
