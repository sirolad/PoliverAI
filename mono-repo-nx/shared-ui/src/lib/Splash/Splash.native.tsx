/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

export const POLIVERAI_SPLASH_DOTLOTTIE_URL =
  'https://lottie.host/60d101b5-d7e9-4e51-8c0c-2624f51e642a/sGDt58V29f.lottie';

interface SplashProps {
  onFinish?: () => void;
  source?: unknown;
  duration?: number;
  delayMs?: number;
  durationMs?: number;
}

const DotLottieComponent =
  Platform.OS === 'windows' ? null : (require('@lottiefiles/dotlottie-react-native').DotLottie as React.ComponentType<any>);

const NativeAnimatedLogo =
  require('../../../../apps/poliverai/assets/brand/poliverai-icon-transparent.svg')?.default ?? null;

export const Splash: React.FC<SplashProps> = ({
  onFinish,
  source,
  duration = 4000,
  delayMs,
  durationMs,
}) => {
  const animRef = useRef<any>(null);
  const fallbackScale = useRef(new Animated.Value(0.9)).current;
  const fallbackOpacity = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const playerSize = Math.min(width, height) * 0.7;
  const clampedPlayerSize = Math.max(220, Math.min(playerSize, 360));
  const playerLeft = (width - clampedPlayerSize) / 2;
  const playerTop = (height - clampedPlayerSize) / 2;
  const dotLottieSource = React.useMemo<{ uri: string } | string | number>(() => {
    if (typeof source === 'string' || typeof source === 'number') {
      return source;
    }

    if (source && typeof source === 'object' && 'uri' in (source as Record<string, unknown>)) {
      return source as { uri: string };
    }

    return { uri: POLIVERAI_SPLASH_DOTLOTTIE_URL };
  }, [source]);

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
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fallbackOpacity, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(fallbackScale, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(fallbackOpacity, {
            toValue: 0.82,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(fallbackScale, {
            toValue: 1.05,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [fallbackOpacity, fallbackScale]);

  useEffect(() => {
    animRef.current?.resize?.(clampedPlayerSize, clampedPlayerSize);
  }, [clampedPlayerSize]);

  const showDotLottie = DotLottieComponent != null;

  return (
    <View style={[styles.container, styles.pointerEventsNone]}>
      {showDotLottie ? (
        <View
          style={[
            styles.playerFrame,
            {
              width: clampedPlayerSize,
              height: clampedPlayerSize,
              left: playerLeft,
              top: playerTop,
            },
          ]}
        >
          <DotLottieComponent
            ref={animRef}
            source={dotLottieSource}
            autoplay
            loop={false}
            style={{
              width: clampedPlayerSize,
              height: clampedPlayerSize,
            }}
            onComplete={onFinish}
          />
        </View>
      ) : (
        <Animated.View
          style={{
            opacity: fallbackOpacity,
            transform: [{ scale: fallbackScale }],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {NativeAnimatedLogo ? <NativeAnimatedLogo width={180} height={180} /> : null}
          <Text style={styles.brand}>PoliverAI</Text>
          {Platform.OS === 'windows' ? <Text style={styles.meta}>Windows fallback splash</Text> : null}
        </Animated.View>
      )}
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
  pointerEventsNone: {
    pointerEvents: 'none',
  },
  playerFrame: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748b',
  },
});

export default Splash;
