import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

type Props = {
  isPro: boolean
  user: unknown
  dashboardLoaded: boolean
  animatedCredits?: Record<string, number>
  animatedSaved?: Record<string, number>
  animatedDeleted?: Record<string, number>
  animatedCompleted?: Record<string, number>
  animatedTx?: Record<string, number>
  reportsRange?: { from: string | null; to: string | null }
  setReportsRange?: (r: { from: string | null; to: string | null }) => void
  completedRange?: { from: string | null; to: string | null }
  setCompletedRange?: (r: { from: string | null; to: string | null }) => void
  txRange?: { from: string | null; to: string | null }
  setTxRange?: (r: { from: string | null; to: string | null }) => void
  defaultFrom?: string | null
  defaultTo?: string | null
  getCostForReport?: (r: unknown) => { credits: number; usd: number }
  userReports?: unknown[]
  txTotals?: { total_bought_credits?: number; total_spent_credits?: number }
  totalSavedCredits?: number
  totalSavedUsd?: number
  formatRangeLabel?: (r: { from: string | null; to: string | null } | null, a: string | null, b: string | null) => string
}

export default function AccountStatus(props: Props) {
  const { isPro, user } = props
  type User = { email?: string }
  const email = (user as unknown as User)?.email ?? ''
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isPro ? 'Pro Account' : 'Free Account'}</Text>
      <Text style={styles.subtitle}>{email}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { color: '#666' },
})
