import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './store';
import { View, ActivityIndicator } from 'react-native';

const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const LoadingFallback = () =>
  isWeb ? (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div>Loading...</div>
    </div>
  ) : (
    <View style={{ flex: 1 }}>
      <ActivityIndicator />
    </View>
  );

export const ReduxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingFallback />} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
};

export default ReduxProvider;
