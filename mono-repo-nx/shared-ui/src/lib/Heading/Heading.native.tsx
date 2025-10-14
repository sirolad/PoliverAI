import React from 'react'
import { Text, ViewStyle, TextStyle } from 'react-native'
import rnStyleFromTokens from '../rnStyleTokens'

type Props = {
  children: React.ReactNode
  level?: 1 | 2 | 3
  style?: ViewStyle
  textStyle?: TextStyle
  center?: boolean
}

export const Heading: React.FC<Props> = ({ children, level = 1, style, textStyle, center = false }) => {
  const size = level === 1 ? '5xl' : level === 2 ? '3xl' : 'xl'
  const weight = level === 1 ? 'bold' : 'semibold'
  return (
    <Text style={[{ textAlign: center ? 'center' : 'left' }, rnStyleFromTokens({ size: size as any, weight: weight as any }) as any, textStyle]}>{children}</Text>
  )
}

export default Heading
