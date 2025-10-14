import React from 'react'
import { View, ScrollView, Text, StyleSheet } from 'react-native'
import { useTranslation, useAuth } from '@poliverai/intl'
import { getDefaultMonthRange, getCost, getCostForReport, computeSavedTotals, computeDerivedFree, formatRangeLabel as _formatRangeLabel } from '../../lib/dashboardHelpers'
import useRampedCounters from '../../hooks/useRampedCounters'
import { computeTransactionTotals } from '../../lib/transactionHelpers'
import transactionsService from '../../services/transactions'
import policyService from '../../services/policyService'
import type { ReportMetadata } from '../../types/api'
import { LoadingSpinner, rnTokens } from '@poliverai/shared-ui'
import {
  QuickActions,
  AvailableFeatures,
  GettingStarted,
  DashboardHeader,
  AccountStatus,
} from '../../components/dashboard'

// Local lightweight fallbacks until the RN app store is fully wired
const useAppDispatch = () => () => {}
const useAppSelector = (_sel: unknown) => ({ events: [], legacyCounts: {} } as { events: unknown[]; legacyCounts: Record<string, number> })
const computeDeletedCountsForRange = (_events: unknown, _legacy: unknown, _range: unknown) => ({ full: 0, revision: 0, free: 0 })

const formatRangeLabel = (range: { from: string | null; to: string | null } | null, defFrom: string | null, defTo: string | null) => _formatRangeLabel(range, defFrom ?? '', defTo ?? '')

type DashboardUser = { subscription_credits?: number; credits?: number; subscription_expires?: string | null } | null

type ReportMetadataMinimal = {
  is_full_report?: boolean
  status?: string
  type?: string
  analysis_mode?: string | number
  filename?: string
}

export default function DashboardFullScreen(): React.ReactElement {
  const { t } = useTranslation()
  const authFromIntl = useAuth() as unknown as { user?: Record<string, unknown> | null; isAuthenticated?: boolean; isPro?: boolean; loading?: boolean; refreshUser?: () => Promise<void>; reportsCount?: number }
  const { user, isAuthenticated, isPro = false, loading = false, refreshUser, reportsCount } = authFromIntl

  const subscriptionCredits = Number((user && (user as Record<string, unknown>).subscription_credits) ?? 0)
  const purchasedCredits = Number((user && (user as Record<string, unknown>).credits) ?? 0)
  const effectiveCredits = subscriptionCredits + purchasedCredits
  const hasCredits = effectiveCredits > 0

  const [userReports, setUserReports] = React.useState<ReportMetadata[] | null>(null)
  const [completedReports, setCompletedReports] = React.useState<ReportMetadata[] | null>(null)

  const { from: defaultFrom, to: defaultTo } = getDefaultMonthRange()
  const [reportsRange, setReportsRange] = React.useState<{ from: string | null; to: string | null }>({ from: defaultFrom, to: defaultTo })
  const [completedRange, setCompletedRange] = React.useState<{ from: string | null; to: string | null }>({ from: defaultFrom, to: defaultTo })
  const [txRange, setTxRange] = React.useState<{ from: string | null; to: string | null }>({ from: defaultFrom, to: defaultTo })

  const [txTotals, setTxTotals] = React.useState<{ total_bought_credits?: number; total_spent_credits?: number; total_subscription_usd?: number; total_subscription_credits?: number } | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const respRaw = await policyService.getUserReports({ date_from: reportsRange.from, date_to: reportsRange.to })
        if (!mounted) return
        const resp = respRaw as unknown as { reports?: ReportMetadata[] } | ReportMetadata[]
        if (Array.isArray(resp)) setUserReports(resp)
        else setUserReports(resp.reports ?? [])
      } catch {
        if (mounted) setUserReports([])
      }
    })()
    return () => { mounted = false }
  }, [reportsRange.from, reportsRange.to])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const respRaw = await policyService.getUserReports({ date_from: completedRange.from, date_to: completedRange.to })
        if (!mounted) return
        const resp = respRaw as unknown as { reports?: ReportMetadata[] } | ReportMetadata[]
        if (Array.isArray(resp)) setCompletedReports(resp)
        else setCompletedReports(resp.reports ?? [])
      } catch {
        if (mounted) setCompletedReports([])
      }
    })()
    return () => { mounted = false }
  }, [completedRange.from, completedRange.to])

  const { totalSavedFiles, fullReportsSaved, revisedDocsSaved, totalSavedCredits, totalSavedUsd, freeReportsSaved } = computeSavedTotals(userReports)
  const hasStatusField = !!((userReports && userReports.find((r) => typeof (r as ReportMetadataMinimal).status !== 'undefined')) || (completedReports && completedReports.find((r) => typeof (r as ReportMetadataMinimal).status !== 'undefined')))

  const fullReportsDone = (completedReports !== null)
    ? (hasStatusField ? completedReports.filter((r) => (r as ReportMetadataMinimal).is_full_report && ((r as ReportMetadataMinimal).status === 'completed')).length : (completedReports.filter((r) => (r as ReportMetadataMinimal).is_full_report).length))
    : (userReports ? (hasStatusField ? userReports.filter((r) => (r as ReportMetadataMinimal).is_full_report && ((r as ReportMetadataMinimal).status === 'completed')).length : fullReportsSaved) : null)

  const revisedCompleted = (completedReports !== null)
    ? (hasStatusField ? completedReports.filter((r) => (r as ReportMetadataMinimal).type === 'revision' && ((r as ReportMetadataMinimal).status === 'completed')).length : (completedReports.filter((r) => (r as ReportMetadataMinimal).type === 'revision').length))
    : (userReports ? (hasStatusField ? userReports.filter((r) => (r as ReportMetadataMinimal).type === 'revision' && ((r as ReportMetadataMinimal).status === 'completed')).length : revisedDocsSaved) : null)

  const derivedFreeReportsSaved = computeDerivedFree(totalSavedFiles, fullReportsSaved, revisedDocsSaved)
  const freeReportsSavedDisplay = derivedFreeReportsSaved !== null ? derivedFreeReportsSaved : freeReportsSaved
  const freeReportsCompleted = userReports
    ? (hasStatusField ? userReports.filter((r) => (((r as ReportMetadataMinimal).analysis_mode || '').toString() === 'fast') && ((r as ReportMetadataMinimal).status === 'completed')).length : freeReportsSaved)
    : null

  // store dispatch/selectors are not yet wired in RN; use local no-op placeholders
  const dispatch = useAppDispatch()
  const deletedState = useAppSelector((_: unknown) => ({ events: [], legacyCounts: {} } as { events: unknown[]; legacyCounts: Record<string, number> }))

  React.useEffect(() => {
    const handler = (_ev: unknown) => {
      // In RN we don't have the deletedReports store yet; keep handler as a no-op
      // TODO: integrate with RN store/event emitter to track deleted reports
      return undefined
    }
    // on native, window events may not be used; keep for parity if code emits them elsewhere
    if (typeof window !== 'undefined' && window?.addEventListener) {
      window.addEventListener('reports:deleted', handler as EventListener)
      return () => window.removeEventListener('reports:deleted', handler as EventListener)
    }
    return undefined
  }, [dispatch])

  const displayedDeletedCounts = computeDeletedCountsForRange(deletedState.events, deletedState.legacyCounts, reportsRange)

  const dashboardLoaded = !loading && (userReports !== null) && (txTotals !== null) && (completedReports !== null)

  const savedTargets = {
    totalSavedFiles: Number(totalSavedFiles ?? 0),
    fullReportsSaved: Number(fullReportsSaved ?? 0),
    revisedDocsSaved: Number(revisedDocsSaved ?? 0),
    freeReportsSaved: Number(freeReportsSavedDisplay ?? 0),
    totalSavedCredits: Number(totalSavedCredits ?? 0),
    totalSavedUsd: Number(totalSavedUsd ?? 0),
  }
  const animatedSaved = useRampedCounters(savedTargets, dashboardLoaded, { durationMs: 1400, maxSteps: 6, minIntervalMs: 60 })

  const deletedTargets = {
    deletedFull: Number(displayedDeletedCounts.full ?? 0),
    deletedRevision: Number(displayedDeletedCounts.revision ?? 0),
    deletedFree: Number(displayedDeletedCounts.free ?? 0),
    deletedTotal: Number((displayedDeletedCounts.full || 0) + (displayedDeletedCounts.revision || 0) + (displayedDeletedCounts.free || 0)),
  }
  const animatedDeleted = useRampedCounters(deletedTargets, dashboardLoaded, { durationMs: 1200, maxSteps: 6, minIntervalMs: 60 })

  const completedTargets = {
    fullReportsDone: Number(fullReportsDone ?? 0),
    revisedCompleted: Number(revisedCompleted ?? 0),
    freeReportsCompleted: Number(freeReportsCompleted ?? 0),
  }
  const animatedCompleted = useRampedCounters(completedTargets, dashboardLoaded, { durationMs: 1200, maxSteps: 6, minIntervalMs: 60 })

  const txTargets = {
    total_bought_credits: Number(txTotals?.total_bought_credits ?? 0),
    total_spent_credits: Number(txTotals?.total_spent_credits ?? 0),
    total_subscription_usd: Number(txTotals?.total_subscription_usd ?? 0),
  }
  const animatedTx = useRampedCounters(txTargets, dashboardLoaded, { durationMs: 1400, maxSteps: 6, minIntervalMs: 80 })

  const creditsTargets = {
    subscriptionCredits: subscriptionCredits,
    purchasedCredits: purchasedCredits,
    effectiveCredits: effectiveCredits,
  }
  const animatedCredits = useRampedCounters(creditsTargets, dashboardLoaded, { durationMs: 1600, maxSteps: 6, minIntervalMs: 80 })

  React.useEffect(() => { return undefined }, [reportsRange.from, reportsRange.to])

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const resp = await transactionsService.listTransactions({ page: 1, limit: 1000, date_from: txRange.from ?? undefined, date_to: txRange.to ?? undefined })
        if (!mounted) return
        const txs = resp.transactions ?? []
        const { total_bought_credits, total_spent_credits, total_subscription_usd, total_subscription_credits } = computeTransactionTotals(txs, resp)
        setTxTotals({ total_bought_credits: total_bought_credits || undefined, total_spent_credits: total_spent_credits || undefined, total_subscription_usd: total_subscription_usd || undefined, total_subscription_credits: total_subscription_credits || undefined })
      } catch {
        if (mounted) setTxTotals(null)
      }
    })()
    return () => { mounted = false }
  }, [txRange.from, txRange.to])

  // Refresh user when payment/transaction events occur elsewhere in the app
  React.useEffect(() => {
    const handler = () => {
      try {
  if (refreshUser) refreshUser().catch(() => undefined)
      } catch {
        // ignore
      }
    }
    // On RN, global event emitters should be used; for parity keep window-based handlers if available
    if (typeof window !== 'undefined' && window?.addEventListener) {
      window.addEventListener('payment:refresh-user', handler as EventListener)
      window.addEventListener('transactions:refresh', handler as EventListener)
      return () => { window.removeEventListener('payment:refresh-user', handler as EventListener); window.removeEventListener('transactions:refresh', handler as EventListener) }
    }
    return undefined
  }, [refreshUser])

  if (loading) return <View style={styles.centered}><LoadingSpinner message={t('dashboard.loading')} size="lg" /></View>
  if (!isAuthenticated) return <View style={styles.centered}><Text>{t('auth.not_authenticated') || 'Please sign in'}</Text></View>

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <DashboardHeader />

      <AccountStatus
        isPro={!!isPro}
        user={user as DashboardUser}
        dashboardLoaded={dashboardLoaded}
        animatedCredits={animatedCredits}
        animatedSaved={animatedSaved}
        animatedDeleted={animatedDeleted}
        animatedCompleted={animatedCompleted}
        animatedTx={animatedTx}
        reportsRange={reportsRange}
        setReportsRange={setReportsRange}
        completedRange={completedRange}
        setCompletedRange={setCompletedRange}
        txRange={txRange}
        setTxRange={setTxRange}
        defaultFrom={defaultFrom}
        defaultTo={defaultTo}
        getCostForReport={(r: unknown) => getCostForReport(r as ReportMetadata)}
        userReports={(userReports ?? undefined) as unknown[] | undefined}
        txTotals={(txTotals ?? undefined) as { total_bought_credits?: number; total_spent_credits?: number } | undefined}
        totalSavedCredits={totalSavedCredits ?? undefined}
        totalSavedUsd={totalSavedUsd ?? undefined}
        formatRangeLabel={formatRangeLabel}
      />

      <QuickActions reportsCount={reportsCount ?? undefined} />

      <AvailableFeatures getCost={getCost} hasCredits={hasCredits} />

      <GettingStarted />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: rnTokens.colors?.pageBg ?? '#fff',
  },
  container: {
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
})
