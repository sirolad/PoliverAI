import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@poliverai/shared-ui';
import { PlatformGreeting } from '@poliverai/shared-ui';
import { Splash } from '@poliverai/shared-ui';
import { AppNavigator } from '../navigation';

export const App = () => {
  const [showSplash, setShowSplash] = useState(true);

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
          <AppNavigator />
        </AuthProvider>
      )}
    </SafeAreaProvider>
  );
};

export default App;
