import React from 'react'
import { Text } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Props = { error?: unknown }

const ErrorText: React.FC<Props> = ({ error }) => {
  if (!error) return null
  return <Text style={rnStyleFromTokens({ size: 'sm', color: 'danger' }) as any}>{String(error)}</Text>
}

export default ErrorText
