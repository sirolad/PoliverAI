import { View, Text, StyleSheet } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Props = { src?: Record<string, unknown> }

export default function FullReportDashboard({ src }: Props) {
  return (
    <View style={styles.container}>
      <Text style={rnStyleFromTokens({ size: 'md' }) as any}>Full Report</Text>
      <Text>{src ? JSON.stringify(src, null, 2) : 'No full report data'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({ container: { padding: 8 } })
