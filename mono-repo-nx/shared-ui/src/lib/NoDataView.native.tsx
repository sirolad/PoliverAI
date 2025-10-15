import { View, Text } from 'react-native'
import rnStyleFromTokens, { rnTokens } from './rnStyleTokens'

type Props = { title?: string, message?: string, iconType?: 'report' | 'locked' | 'none', iconSize?: 'md' | 'lg' }

export default function NoDataView({ title, message }: Props) {
  return (
    <View style={{ padding: rnTokens.spacing.card, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={rnStyleFromTokens({ size: 'lg', weight: 'semibold' }) as any}>{title}</Text>
      {message ? <Text style={[{ marginTop: rnTokens.spacing.small }, rnStyleFromTokens({ size: 'sm' }) as any]}>{message}</Text> : null}
    </View>
  )
}
