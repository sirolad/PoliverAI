import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DashboardHeader: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
});

export default DashboardHeader;
