import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';

export interface CardProps {
  children: React.ReactNode;
  style?: object;
}

const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 2px 12px rgba(15, 23, 42, 0.10)' } as any)
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }),
    elevation: 2,
    marginVertical: 8,
  },
});

export default Card;
