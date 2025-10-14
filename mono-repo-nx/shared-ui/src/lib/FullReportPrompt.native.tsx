import { View, Text, Button, StyleSheet } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Props = { onGenerate?: () => void, disabled?: boolean }

export default function FullReportPrompt({ onGenerate, disabled }: Props) {
  return (
    <View style={styles.container}>
      <Text style={rnStyleFromTokens({ size: 'md' }) as any}>Generate a full report to see detailed findings</Text>
      <Button title="Generate" onPress={() => { if (onGenerate) onGenerate() }} disabled={disabled} />
    </View>
  )
}

const styles = StyleSheet.create({ container: { padding: 8 } })
