import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import useQuickActions, { QuickAction } from '../../hooks/useQuickActions'
import { Card } from '@poliverai/shared-ui'

type Props = { reportsCount?: number }

export default function QuickActions({ reportsCount }: Props) {
  const { actions } = useQuickActions(reportsCount)

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{/* localized in hook */}</Text>
      <View style={styles.grid}>
  {actions.map((a: QuickAction) => a.visible && (
          <TouchableOpacity key={a.key} style={styles.cardButton} onPress={() => { /* navigation handled in hook in RN app later */ }}>
            <Card style={styles.cardInner}>
              <View style={styles.row}>
                <View style={styles.iconPlaceholder} />
                <View>
                  <Text style={styles.title}>{a.title}</Text>
                  <Text style={styles.desc}>{a.desc}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  heading: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardButton: { flex: 1, minWidth: 160 },
  cardInner: { padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconPlaceholder: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#eee', marginRight: 12 },
  title: { fontSize: 16, fontWeight: '600' },
  desc: { fontSize: 13, color: '#666' },
})
