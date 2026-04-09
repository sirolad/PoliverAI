import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';

interface SplashProps {
  onFinish?: () => void;
  duration?: number;
  delayMs?: number;
  durationMs?: number;
}

export const Splash: React.FC<SplashProps> = ({
  onFinish,
  duration = 2200,
  delayMs,
  durationMs,
}) => {
  const logoScale = useRef(new Animated.Value(0.94)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const shimmerTranslate = useRef(new Animated.Value(-220)).current;
  const brandImage = require('../../../../apps/poliverai/assets/brand/poliverai-logo-native.png') as number;

  useEffect(() => {
    const ms =
      typeof durationMs === 'number'
        ? durationMs
        : typeof delayMs === 'number'
          ? delayMs
          : duration;

    const timer = setTimeout(() => {
      onFinish?.();
    }, ms);

    return () => clearTimeout(timer);
  }, [delayMs, duration, durationMs, onFinish]);

  useEffect(() => {
    const intro = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 0.92,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1.03,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const shimmer = Animated.loop(
      Animated.timing(shimmerTranslate, {
        toValue: 220,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );

    intro.start(() => {
      pulse.start();
      shimmer.start();
    });

    return () => {
      pulse.stop();
      shimmer.stop();
    };
  }, [logoOpacity, logoScale, shimmerTranslate]);

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.backgroundGlow} />
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image source={brandImage} style={styles.logoImage} resizeMode="contain" />
        <View style={styles.logoShimmerMask}>
          <Animated.View
            style={[
              styles.logoShimmer,
              {
                transform: [{ translateX: shimmerTranslate }, { rotate: '18deg' }],
              },
            ]}
          />
        </View>
      </Animated.View>
      <Animated.View style={[styles.copyWrap, { opacity: logoOpacity }]}>
        <Text style={styles.brand}>Poliver AI</Text>
        <Text style={styles.subcopy}>Preparing your workspace...</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  backgroundGlow: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  logoWrap: {
    width: 260,
    height: 260,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#2563eb',
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 14,
    },
  },
  logoImage: {
    width: 220,
    height: 220,
  },
  logoShimmerMask: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  logoShimmer: {
    position: 'absolute',
    top: -40,
    bottom: -40,
    width: 84,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  copyWrap: {
    marginTop: 22,
    alignItems: 'center',
  },
  brand: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  subcopy: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
});

export default Splash;
