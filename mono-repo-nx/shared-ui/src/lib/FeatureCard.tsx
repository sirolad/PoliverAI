import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface FeatureCardProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  available?: boolean;
  style?: object;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, available = true, style }) => {
  return (
    <View style={[styles.card, !available && styles.unavailable, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {!available && <Text style={styles.unavailableText}>Unavailable</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    alignItems: 'flex-start',
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  unavailable: {
    opacity: 0.5,
  },
  unavailableText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
});

export default FeatureCard;
