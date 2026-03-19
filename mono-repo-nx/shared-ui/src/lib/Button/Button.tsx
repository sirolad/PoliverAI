import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { rnTokens, colorFromToken } from '../rnStyleTokens'

export interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  children,
}) => {
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      sm: { paddingVertical: 8, paddingHorizontal: 16 },
      md: { paddingVertical: 12, paddingHorizontal: 20 },
      lg: { paddingVertical: 16, paddingHorizontal: 24 },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: disabled ? colorFromToken(rnTokens.colors.mutedText) : colorFromToken(rnTokens.colors.primary),
      },
      secondary: {
        backgroundColor: disabled ? colorFromToken(rnTokens.colors.surfaceMuted) : colorFromToken(rnTokens.colors.textSecondary),
      },
      outline: {
        backgroundColor: 'transparent',
        // borderWidth: 1,
        // borderColor: disabled ? colorFromToken(rnTokens.colors.mutedBorder) : colorFromToken(rnTokens.colors.primary),
      },
      destructive: {
        backgroundColor: disabled ? colorFromToken(rnTokens.colors.mutedText) : colorFromToken(rnTokens.colors.danger),
      },
      ghost: {
        backgroundColor: 'transparent',
      }
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...style,
    };
  };

  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: '600',
    };

    // Size styles
    const sizeStyles: Record<string, TextStyle> = {
      sm: { fontSize: 14 },
      md: { fontSize: 16 },
      lg: { fontSize: 18 },
    };

    // Variant styles
    const variantStyles: Record<string, TextStyle> = {
      primary: {
        color: disabled ? colorFromToken(rnTokens.colors.ctaText) ?? '#FFFFFF' : colorFromToken(rnTokens.colors.ctaText) ?? '#FFFFFF',
      },
      secondary: {
        color: disabled ? colorFromToken(rnTokens.colors.mutedText) ?? '#9CA3AF' : colorFromToken(rnTokens.colors.surface) ?? '#FFFFFF',
      },
      outline: {
        color: disabled ? colorFromToken(rnTokens.colors.mutedText) ?? '#9CA3AF' : colorFromToken(rnTokens.colors.primary) ?? '#3B82F6',
      },
      destructive: {
        color: colorFromToken(rnTokens.colors.surface) ?? '#FFFFFF',
      },
      ghost: {
        color: colorFromToken(rnTokens.colors.textPrimary) ?? '#111827',
      }
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...textStyle,
    };
  };

  return (
    <TouchableOpacity
      style={getButtonStyles()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? (colorFromToken(rnTokens.colors.primary) ?? '#3B82F6') : (colorFromToken(rnTokens.colors.ctaText) ?? '#FFFFFF')} 
          style={{ marginRight: 8 }} 
        />
      )}
      {children ? children : <Text style={getTextStyles()}>{title}</Text>}
    </TouchableOpacity>
  );
};