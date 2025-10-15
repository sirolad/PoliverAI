import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export interface QuickActionsProps {
  reportsCount?: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({ reportsCount }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <Button title="New Report" onPress={() => {}} />
      <Text style={styles.count}>Reports: {reportsCount ?? 0}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f1f5f9',
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
  count: {
    fontSize: 14,
    color: '#2563eb',
    marginTop: 8,
  },
});

export default QuickActions;
