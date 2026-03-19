import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DashboardFullScreen } from '../DashboardScreens';

export const HomeScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DashboardFullScreen />
    </SafeAreaView>
  );
};
