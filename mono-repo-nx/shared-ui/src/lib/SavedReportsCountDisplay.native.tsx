import React from 'react'
import { Text } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Props = { count?: number }

const SavedReportsCountDisplay: React.FC<Props> = ({ count }) => {
  const enabled = typeof count === 'number'
  // simple animated counter placeholder — return number as string for now
  return <Text style={rnStyleFromTokens({ size: 'sm' }) as any}>{enabled ? String(count) : ''}</Text>
}

export default SavedReportsCountDisplay
