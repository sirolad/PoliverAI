import { View, ActivityIndicator, Text } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Props = { message?: string, subtext?: string, size?: 'sm' | 'lg' }

export default function LoadingSpinner({ message, subtext }: Props) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <ActivityIndicator size="large" />
      {message ? <Text style={rnStyleFromTokens({ size: 'sm' }) as any}>{message}</Text> : null}
  {subtext ? <Text style={rnStyleFromTokens({ size: 'sm' }) as any}>{subtext}</Text> : null}
    </View>
  )
}
