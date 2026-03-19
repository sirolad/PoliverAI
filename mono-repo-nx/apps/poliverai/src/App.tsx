import React from 'react';
import { StatusBar, Platform, View, StyleSheet, NativeModules } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './navigation';
import { AuthProvider, useAuth } from '@poliverai/intl';
import { Splash, appColors } from '@poliverai/shared-ui';

function NativeStartupSplash() {
  const [visible, setVisible] = React.useState(true);

  const hideMacSplashScreen = React.useCallback(() => {
    if (Platform.OS === 'macos') {
      NativeModules.MacSplashScreen?.hide?.();
    }
  }, []);

  if (!visible || Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} onLayout={hideMacSplashScreen}>
      <Splash
        delayMs={200}
        durationMs={5000}
        onFinish={() => setVisible(false)}
      />
    </View>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const initialPlatform = Platform.OS === 'web' ? 'web' : 'native';
  console.log('[startup] AppContent render', {
    platform: Platform.OS,
    isAuthenticated,
    loading,
    initialPlatform,
  });

  return (
    <View style={styles.appRoot}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AppNavigator initialPlatform={initialPlatform} isAuthenticated={isAuthenticated} isLoading={loading} />
      <NativeStartupSplash />
    </View>
  );
}

export const App = () => {
  console.log('[startup] App root render', { platform: Platform.OS });
  console.log('[startup] App root -> AuthProvider path');
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    backgroundColor: appColors.white,
  },
});
