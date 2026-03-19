import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LayoutDashboard, Sparkles } from 'lucide-react-native'
import useDashboardHeader from '../../hooks/useDashboardHeader'
import { rnTokens, colorFromToken } from '@poliverai/shared-ui'

type DashboardHeaderProps = {
  name?: string
}

export default function DashboardHeader({ name }: DashboardHeaderProps) {
  const { title, subtitle } = useDashboardHeader()
  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <LayoutDashboard size={16} color="#1d4ed8" />
          <Text style={styles.badgeText}>Dashboard</Text>
        </View>
        {name ? (
          <View style={styles.badgeSecondary}>
            <Sparkles size={14} color="#0f766e" />
            <Text style={styles.badgeSecondaryText}>{name}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 18 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#dbeafe',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  badgeSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#ccfbf1',
  },
  badgeSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f766e',
  },
  title: { fontSize: 24, fontWeight: '700', color: colorFromToken(rnTokens.colors.textPrimary) },
  subtitle: { fontSize: 15, lineHeight: 22, color: colorFromToken(rnTokens.colors.textMuted), marginTop: 6 },
})
