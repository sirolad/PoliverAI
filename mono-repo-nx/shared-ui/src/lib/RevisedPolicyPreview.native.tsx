import { View, Text, Button, StyleSheet, Linking, ScrollView } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Props = { downloadUrl: string | null, filename?: string | null, inlineContent?: string | null }

export default function RevisedPolicyPreview({ downloadUrl, filename, inlineContent }: Props) {
  if (downloadUrl) {
    return (
      <View style={styles.container}>
        <Text style={rnStyleFromTokens({ size: 'sm' }) as any}>Revised policy preview</Text>
        <View style={{ height: 480, marginTop: 12 }}>
          <Text style={{ color: 'blue' }} onPress={() => { Linking.openURL(downloadUrl) }}>{`Open ${filename ?? 'revised policy'}`}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
      <View style={styles.placeholderCircle}>
        <Text style={rnStyleFromTokens({ size: 'lg' }) as any}>📄</Text>
      </View>
      <Text style={rnStyleFromTokens({ size: 'lg', weight: 'semibold' }) as any}>Nothing here — generate a revised policy</Text>
      <Text style={rnStyleFromTokens({ size: 'sm' }) as any}>Generate a revised policy to see it here or open a saved report.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  placeholderCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }
})

