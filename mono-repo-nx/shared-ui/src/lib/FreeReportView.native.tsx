import { View, Text, StyleSheet } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Props = { result?: any }

export default function FreeReportView({ result }: Props) {
  return (
    <View style={styles.container}>
      <Text style={rnStyleFromTokens({ size: 'md' }) as any}>Quick Analysis</Text>
      <Text>{result ? JSON.stringify(result, null, 2) : 'No result'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({ container: { padding: 8 } })
