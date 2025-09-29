import React, { ReactNode } from 'react';
import { View, ViewStyle, TouchableOpacity, StyleProp } from 'react-native';

export interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  shadow?: boolean;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  shadow = true,
  padding = 16,
}) => {
  const baseStyle: ViewStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding,
    ...(shadow && {
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4, // for Android
    }),
  };

  // Accept StyleProp<ViewStyle> and merge via array to avoid spreading non-object types
  const cardStyle = [baseStyle, style];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle as any}>{children}</View>;
};