import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native'
import rnStyleFromTokens, { rnTokens } from './rnStyleTokens'

type Props = {
  onPress?: () => void
  title?: string | React.ReactNode
  loading?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  disabled?: boolean
  variant?: 'primary' | 'outline' | 'destructive' | 'ghost'
}

export default function Button({ onPress, title, loading, style, textStyle, disabled, variant = 'primary' }: Props) {
  const baseTextStyle = rnStyleFromTokens({ size: 'md', weight: 'medium' })

  const bgColor = variant === 'primary' ? (rnTokens.colors.primaryBg?.hex ?? '#2563eb') : variant === 'destructive' ? (rnTokens.colors.red600?.hex ?? '#dc2626') : 'transparent'
  const textColor = variant === 'primary' ? (rnTokens.colors.white?.hex ?? '#fff') : (rnTokens.colors.textPrimary?.hex ?? '#111827')

  const containerStyle: any = {
    backgroundColor: bgColor,
    paddingVertical: rnTokens.buttons.base.paddingVertical,
    paddingHorizontal: rnTokens.buttons.base.paddingHorizontal,
    borderRadius: rnTokens.buttons.base.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.6 : 1,
  }

  const mergedTextStyle: any = { ...(baseTextStyle as object), color: textColor, ...(textStyle as any) }

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} style={[containerStyle, style]}>
      {loading ? <ActivityIndicator color={textColor} /> : (typeof title === 'string' ? <Text style={mergedTextStyle as any}>{title}</Text> : title)}
    </TouchableOpacity>
  )
}
