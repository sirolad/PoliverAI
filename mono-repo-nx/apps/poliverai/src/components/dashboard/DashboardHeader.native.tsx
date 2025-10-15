import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import useDashboardHeader from '../../hooks/useDashboardHeader'
import { rnTokens, rnStyleFromTokens } from '@poliverai/shared-ui'

export default function DashboardHeader() {
  const { title, subtitle } = useDashboardHeader()
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: rnTokens.colors.textPrimary },
  subtitle: { fontSize: 14, color: rnTokens.colors.textMuted, marginTop: 4 },
})
