import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: object;
}

const Button: React.FC<ButtonProps> = ({ title, onPress, disabled, loading, icon, style }) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled ? styles.disabled : {}, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {icon && <View style={styles.icon}>{icon}</View>}
        {loading ? (
          <ActivityIndicator color="#fff" style={styles.loading} />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    marginLeft: 8,
  },
});

export default Button;
