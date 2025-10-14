import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'
import Button from './Button.native'

type Props = {
  result?: any | null
  resetAll?: () => void
  openSaveModal?: () => void
  openInstructions?: () => void
}

export default function TopControls({ result, resetAll, openSaveModal, openInstructions }: Props) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={rnStyleFromTokens({ size: 'xl', weight: 'semibold' }) as any}>Policy Analysis</Text>
        {result ? <Text style={rnStyleFromTokens({ size: 'sm' }) as any}>{`Verdict: ${result.verdict ?? ''}`}</Text> : null}
      </View>

      <View style={styles.actions}>
        <Button title="How it works" onPress={() => { if (openInstructions) openInstructions() }} />
        <Button title="Reset" onPress={() => { if (resetAll) resetAll() }} />
        <Button title="Save report" onPress={() => { if (openSaveModal) openSaveModal() }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({ container: { padding: 8 }, actions: { flexDirection: 'row', gap: 8 } as any })
