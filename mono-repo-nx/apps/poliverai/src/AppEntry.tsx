import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '@poliverai/intl';
import { NavBar } from '@poliverai/shared-ui';
import { AppNavigator } from './navigation/AppNavigator/AppNavigator';

export default function WebAppEntry() {
  return (
    <AuthProvider>
      <WebApp />
    </AuthProvider>
  );
}

function WebApp() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <View style={styles.root}>
      <NavBar />
      <AppNavigator initialPlatform="web" isAuthenticated={isAuthenticated} isLoading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
