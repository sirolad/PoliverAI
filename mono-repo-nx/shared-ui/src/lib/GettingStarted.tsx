import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GettingStarted: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Getting Started</Text>
      <Text style={styles.text}>Welcome to PoliverAI! Start by uploading your first policy document.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff7ed',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ea580c',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#374151',
  },
});

export default GettingStarted;
