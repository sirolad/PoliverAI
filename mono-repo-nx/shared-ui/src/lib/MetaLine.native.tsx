import React from 'react'
import { Text, View } from 'react-native'
import rnStyleFromTokens, { rnTokens } from './rnStyleTokens'

type Props = { children?: React.ReactNode }

export const MetaLine: React.FC<Props> = ({ children }) => {
  if (!children) return null
  return (
    <View style={{ marginTop: rnTokens.spacing.small ?? 8 }}>
      <Text style={rnStyleFromTokens({ size: 'sm', color: 'textMuted' }) as any}>{children}</Text>
    </View>
  )
}

export default MetaLine
