import { View, Text, Button, StyleSheet } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Props = { activeTab: string, setActiveTab: (s: string) => void, reportFilename?: string | null }

export default function TabControls({ activeTab, setActiveTab }: Props) {
  return (
    <View style={styles.row}>
      <Button title="Free" onPress={() => setActiveTab('free')} />
      <Button title="Full" onPress={() => setActiveTab('full')} />
      <Button title="Revised" onPress={() => setActiveTab('revised')} />
    </View>
  )
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 8 } as any })
