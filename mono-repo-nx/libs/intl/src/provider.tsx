import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './store';
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';

const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const LoadingFallback = () =>
  isWeb ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div>Loading...</div>
    </div>
  ) : (
    <View style={styles.loadingRoot}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.loadingText}>
        {Platform.OS === 'macos' ? 'Loading desktop session...' : 'Loading...'}
      </Text>
    </View>
  );

export const ReduxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log('[startup] ReduxProvider render', { platform: Platform.OS });

  if (Platform.OS === 'macos') {
    return <Provider store={store}>{children}</Provider>;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingFallback />} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
};

export default ReduxProvider;

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
  },
});
