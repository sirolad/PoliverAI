import React, { useState } from 'react';
import { StatusBar, Platform, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './navigation';
import { Splash } from '@poliverai/shared-ui';

// Lightweight local AuthProvider to avoid importing from @poliverai/shared-ui and break the circular dependency.
const AuthProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  // TODO: replace with real auth logic or move to a separate package that doesn't depend on this app.
  return children as React.ReactElement;
};

// Minimal PlatformGreeting replacement to avoid importing from shared-ui.
const PlatformGreeting: React.FC = () => {
  if (Platform.OS === 'web') {
    return null;
  }
  return (
    <View style={{ padding: 8 }}>
      <Text>Welcome to PoliverAI</Text>
    </View>
  );
};


export const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  // Decide initial behavior based on platform.
  // For web, we want the web root to show the web landing (handled in MainWeb),
  // but ensure AppNavigator knows the platform in case it needs to choose initial route.
  const initialPlatform = Platform.OS === 'web' ? 'web' : 'native';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <PlatformGreeting />
      {showSplash && (
        <Splash
          onFinish={() => {
            setShowSplash(false);
          }}
        />
      )}
      {!showSplash && (
        <AuthProvider>
          <AppNavigator initialPlatform={initialPlatform} />
        </AuthProvider>
      )}
    </SafeAreaProvider>
  );
};

export default App;
