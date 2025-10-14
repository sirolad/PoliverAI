import { } from 'react'
import { View, Text, Button, StyleSheet, TouchableOpacity } from 'react-native'
import rnStyleFromTokens from './rnStyleTokens'

type Props = { title?: string, onOpen?: () => void, selected?: boolean, onToggle?: () => void }

export default function ReportCard({ title, onOpen, selected = false, onToggle }: Props) {
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => onToggle && onToggle()} style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: selected ? '#2563eb' : 'transparent', marginRight: 8, alignItems: 'center', justifyContent: 'center' }}>
            {selected ? <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text> : null}
          </TouchableOpacity>
          <Text style={rnStyleFromTokens({ size: 'md', weight: 'medium' }) as any}>{title ?? 'Report'}</Text>
        </View>
        <Button title="Open" onPress={() => { if (onOpen) onOpen() }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({ card: { padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 8 } })
