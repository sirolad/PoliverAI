import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { appColors } from './colorTokens';

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
    backgroundColor: appColors.gray50,
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    shadowColor: appColors.black,
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
    color: appColors.ink900,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: appColors.gray700,
    marginBottom: 4,
  },
  unavailable: {
    opacity: 0.5,
  },
  unavailableText: {
    color: appColors.red500,
    fontSize: 12,
    marginTop: 4,
  },
});

export default FeatureCard;
