import React from 'react'
import { TouchableOpacity, ViewStyle, Text, AccessibilityProps } from 'react-native'
import rnStyleFromTokens, { rnTokens } from './rnStyleTokens'

type Props = AccessibilityProps & {
  children?: React.ReactNode
  style?: ViewStyle
  onPress?: () => void
}

const IconButton: React.FC<Props> = ({ children, style, onPress, accessibilityLabel }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? 'icon-button'}
      style={[{ padding: 8, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      {typeof children === 'string' ? <Text style={rnStyleFromTokens({ size: 'sm' }) as any}>{children}</Text> : children}
    </TouchableOpacity>
  )
}

export default IconButton
