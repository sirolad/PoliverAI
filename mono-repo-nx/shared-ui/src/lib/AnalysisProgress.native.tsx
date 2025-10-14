import { View, Text, StyleSheet } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Props = { message?: string, progress?: number }

export default function AnalysisProgress({ message, progress = 0 }: Props) {
  return (
    <View style={styles.container}>
      <Text style={rnStyleFromTokens({ size: 'sm' }) as any}>{message}</Text>
      <Text style={rnStyleFromTokens({ size: 'sm' }) as any}>{`Progress: ${Math.round(progress)}%`}</Text>
    </View>
  )
}

const styles = StyleSheet.create({ container: { padding: 8 } })
