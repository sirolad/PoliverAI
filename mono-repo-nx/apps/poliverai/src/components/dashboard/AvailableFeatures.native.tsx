import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import useAvailableFeatures from '../../hooks/useAvailableFeatures'
import { Card } from '@poliverai/shared-ui'

type Props = { getCost?: (k?: string) => { credits: number; usd: number } | undefined; hasCredits: boolean }

export default function AvailableFeatures({ getCost, hasCredits }: Props) {
  const { freeFeatures, proFeatures } = useAvailableFeatures(hasCredits)

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Features</Text>

      <View style={styles.section}>
        <Text style={styles.subheading}>Free</Text>
        <View style={styles.grid}>
          {freeFeatures.map((feature, idx) => (
            <Card key={idx} style={styles.card}><Text>{feature.title}</Text></Card>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.subheading}>Pro</Text>
        <View style={styles.grid}>
          {proFeatures.map((feature, idx) => (
            <Card key={idx} style={styles.card}><Text>{feature.title}</Text></Card>
          ))}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  heading: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  section: { marginTop: 8 },
  subheading: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { padding: 12, minWidth: 120, margin: 4 },
})
