import React from 'react';
import { StatusBar, Platform, View, StyleSheet, NativeModules, Text, useWindowDimensions } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
} from 'react-native-safe-area-context';
import { AppNavigator } from './navigation';
import { AuthProvider, useAuth } from '@poliverai/intl';
import { Splash, appColors } from '@poliverai/shared-ui';

function RootSafeAreaProvider({ children }: { children: React.ReactNode }) {
  const window = useWindowDimensions();

  if (Platform.OS !== 'macos') {
    return <SafeAreaProvider>{children}</SafeAreaProvider>;
  }

  return (
    <SafeAreaFrameContext.Provider
      value={{
        x: 0,
        y: 0,
        width: window.width,
        height: window.height,
      }}
    >
      <SafeAreaInsetsContext.Provider
        value={{
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      >
        <View style={styles.safeAreaShim}>{children}</View>
      </SafeAreaInsetsContext.Provider>
    </SafeAreaFrameContext.Provider>
  );
}

function NativeStartupSplash({
  appReady,
}: {
  appReady: boolean;
}) {
  const [visible, setVisible] = React.useState(true);
  const [minDurationElapsed, setMinDurationElapsed] = React.useState(false);
  const splashDurationMs = Platform.OS === 'macos' ? 2400 : 5000;

  const hideMacSplashScreen = React.useCallback(() => {
    if (Platform.OS === 'macos') {
      NativeModules.MacSplashScreen?.hide?.();
    }
  }, []);

  React.useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setMinDurationElapsed(true);
    }, splashDurationMs);

    return () => clearTimeout(timer);
  }, [splashDurationMs, visible]);

  React.useEffect(() => {
    if (!visible || !minDurationElapsed || !appReady) {
      return;
    }

    hideMacSplashScreen();
    setVisible(false);
  }, [appReady, hideMacSplashScreen, minDurationElapsed, visible]);

  if (!visible || Platform.OS === 'web' || Platform.OS === 'macos') {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Splash
        delayMs={200}
        durationMs={splashDurationMs}
        onFinish={() => {
          if (minDurationElapsed && appReady) {
            hideMacSplashScreen();
            setVisible(false);
          }
        }}
      />
    </View>
  );
}

function AppContent({ onReady }: { onReady?: () => void }) {
  const { isAuthenticated, loading } = useAuth();
  const initialPlatform = Platform.OS === 'web' ? 'web' : 'native';
  console.log('[startup] AppContent render', {
    platform: Platform.OS,
    isAuthenticated,
    loading,
    initialPlatform,
  });

  React.useEffect(() => {
    console.log('[startup] AppContent mounted');
    onReady?.();
  }, [onReady]);

  return (
    <View style={styles.appRoot}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AppNavigator initialPlatform={initialPlatform} isAuthenticated={isAuthenticated} isLoading={loading} />
      <NativeStartupSplash appReady={Platform.OS === 'macos' ? true : !loading} />
    </View>
  );
}

export const App = () => {
  const [appContentReady, setAppContentReady] = React.useState(false);
  const [showMacFallback, setShowMacFallback] = React.useState(false);

  console.log('[startup] App root render', { platform: Platform.OS });
  console.log('[startup] App root -> AuthProvider path');

  React.useEffect(() => {
    if (Platform.OS !== 'macos') {
      return undefined;
    }

    const hideTimer = setTimeout(() => {
      console.log('[startup] App root forcing MacSplashScreen.hide');
      NativeModules.MacSplashScreen?.hide?.();
    }, 700);

    const fallbackTimer = setTimeout(() => {
      console.log('[startup] App root enabling macOS fallback overlay');
      setShowMacFallback(true);
    }, 1800);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  React.useEffect(() => {
    if (Platform.OS === 'macos' && appContentReady) {
      console.log('[startup] App root macOS content ready');
      NativeModules.MacSplashScreen?.hide?.();
      setShowMacFallback(false);
    }
  }, [appContentReady]);

  return (
    <View style={styles.rootShell}>
      <RootSafeAreaProvider>
        <AuthProvider>
          <AppContent onReady={() => setAppContentReady(true)} />
        </AuthProvider>
      </RootSafeAreaProvider>
      {Platform.OS === 'macos' && showMacFallback && !appContentReady ? (
        <View style={styles.macFallbackOverlay} pointerEvents="none">
          <View style={styles.macFallbackCard}>
            <Text style={styles.macFallbackTitle}>macOS App Still Initializing</Text>
            <Text style={styles.macFallbackBody}>
              The native splash was forced closed, but the main UI has not mounted yet.
            </Text>
            <Text style={styles.macFallbackBody}>
              Current trace reached `App root render` but not `AppContent render`.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  rootShell: {
    flex: 1,
    backgroundColor: appColors.white,
  },
  safeAreaShim: {
    flex: 1,
    backgroundColor: appColors.white,
  },
  appRoot: {
    flex: 1,
    backgroundColor: appColors.white,
  },
  macFallbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  macFallbackCard: {
    width: '100%',
    maxWidth: 680,
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  macFallbackTitle: {
    color: '#0f172a',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
  },
  macFallbackBody: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
});
