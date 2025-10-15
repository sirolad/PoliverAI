import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface AvailableFeaturesProps {
  getCost: (feature?: any) => number;
  hasCredits: boolean;
}

const AvailableFeatures: React.FC<AvailableFeaturesProps> = ({ getCost, hasCredits }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Available Features</Text>
      <Text style={styles.feature}>{hasCredits ? 'Premium Features Unlocked' : 'Upgrade for more features'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  feature: {
    fontSize: 14,
    color: '#2563eb',
  },
});

export default AvailableFeatures;
