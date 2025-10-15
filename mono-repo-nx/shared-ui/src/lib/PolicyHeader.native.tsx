import { View, Text, StyleSheet } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Props = { activeTab?: string, result?: any }

export default function PolicyHeader({ activeTab, result }: Props) {
  return (
    <View style={styles.container}>
      <Text style={rnStyleFromTokens({ size: 'xl', weight: 'semibold' }) as any}>Policy Analysis</Text>
      {result ? <Text style={rnStyleFromTokens({ size: 'sm' }) as any}>{`Verdict: ${result.verdict ?? ''}`}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({ container: { padding: 8 } })
