import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import useGettingStarted from '../../hooks/useGettingStarted'
import { Card } from '@poliverai/shared-ui'

export default function GettingStarted() {
  const { title, description, steps } = useGettingStarted()

  return (
    <Card style={{ padding: 12 }}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      <View style={styles.steps}>
  {steps.map((s: { id: number; title: string; desc: string }) => (
          <View key={s.id} style={styles.stepRow}>
            <View style={styles.stepBadge}><Text style={styles.badgeText}>{s.id}</Text></View>
            <View>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '600' },
  desc: { color: '#666', marginBottom: 8 },
  steps: { marginTop: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  stepBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  badgeText: { fontWeight: '700' },
  stepTitle: { fontWeight: '600' },
  stepDesc: { color: '#666' },
})
