import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useAuth, t, getDefaultMonthRange, ReportMetadata, computeSavedTotals, getCostForReport, formatRangeLabel, computeDerivedFree, transactionsService, computeTransactionTotals, policyService } from '@poliverai/intl';
import { AccountStatus, QuickActions, AvailableFeatures, GettingStarted, DashboardHeader, colors as rnTokens, spacing } from '@poliverai/shared-ui';
import AppTopNav from '../../components/AppTopNav';
import AppFooter from '../../components/AppFooter';
import useRampedCounters from '../../hooks/useRampedCounters';

export const DashboardFullScreen: React.FC = () => {
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
  const [deletedState, setDeletedState] = React.useState<{ events: Array<{ ts: number; counts: { full: number; revision: number; free: number } }>; legacyCounts: { full: number; revision: number; free: number } }>({
    events: [],
    legacyCounts: { full: 0, revision: 0, free: 0 },
  })

  const computeDeletedCountsForRange = React.useCallback((
    events: Array<{ ts: number; counts: { full: number; revision: number; free: number } }>,
    legacy: { full: number; revision: number; free: number },
    range: { from: string | null; to: string | null },
  ) => {
    if (!events || events.length === 0) return legacy
    const fromTs = range.from ? new Date(range.from).setHours(0, 0, 0, 0) : null
    const toTs = range.to ? new Date(range.to).setHours(23, 59, 59, 999) : null
    return events
      .filter((event) => {
        if (fromTs && event.ts < fromTs) return false
        if (toTs && event.ts > toTs) return false
        return true
      })
      .reduce((acc, event) => ({
        full: acc.full + (event.counts.full || 0),
        revision: acc.revision + (event.counts.revision || 0),
        free: acc.free + (event.counts.free || 0),
      }), { full: 0, revision: 0, free: 0 })
  }, [])

  React.useEffect(() => {
    if (loading || !isAuthenticated) {
      setUserReports(null)
      return undefined
    }
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
  }, [isAuthenticated, loading, reportsRange.from, reportsRange.to])

  React.useEffect(() => {
    if (loading || !isAuthenticated) {
      setCompletedReports(null)
      return undefined
    }
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
  }, [completedRange.from, completedRange.to, isAuthenticated, loading])

  const { totalSavedFiles, fullReportsSaved, revisedDocsSaved, totalSavedCredits, totalSavedUsd, freeReportsSaved } = computeSavedTotals(userReports)
  const hasStatusField = !!((userReports && userReports.find((r) => typeof (r as ReportMetadata).status !== 'undefined')) || (completedReports && completedReports.find((r) => typeof (r as ReportMetadata).status !== 'undefined')))

  const fullReportsDone = (completedReports !== null)
    ? (hasStatusField ? completedReports.filter((r) => (r as ReportMetadata).is_full_report && ((r as ReportMetadata).status === 'completed')).length : (completedReports.filter((r) => (r as ReportMetadata).is_full_report).length))
    : (userReports ? (hasStatusField ? userReports.filter((r) => (r as ReportMetadata).is_full_report && ((r as ReportMetadata).status === 'completed')).length : fullReportsSaved) : null)

  const revisedCompleted = (completedReports !== null)
    ? (hasStatusField ? completedReports.filter((r) => (r as ReportMetadata).type === 'revision' && ((r as ReportMetadata).status === 'completed')).length : (completedReports.filter((r) => (r as ReportMetadata).type === 'revision').length))
    : (userReports ? (hasStatusField ? userReports.filter((r) => (r as ReportMetadata).type === 'revision' && ((r as ReportMetadata).status === 'completed')).length : revisedDocsSaved) : null)

  const derivedFreeReportsSaved = computeDerivedFree(totalSavedFiles, fullReportsSaved, revisedDocsSaved)
  const freeReportsSavedDisplay = derivedFreeReportsSaved !== null ? derivedFreeReportsSaved : freeReportsSaved
  const freeReportsCompleted = userReports
    ? (hasStatusField ? userReports.filter((r) => (((r as ReportMetadata).analysis_mode || '').toString() === 'fast') && ((r as ReportMetadata).status === 'completed')).length : freeReportsSaved)
    : null

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
  const animatedSaved = useRampedCounters(savedTargets, dashboardLoaded, { durationMs: 1400, maxSteps: 6, minIntervalMs: 60 });

  const deletedTargets = {
    deletedFull: Number(displayedDeletedCounts.full ?? 0),
    deletedRevision: Number(displayedDeletedCounts.revision ?? 0),
    deletedFree: Number(displayedDeletedCounts.free ?? 0),
    deletedTotal: Number((displayedDeletedCounts.full || 0) + (displayedDeletedCounts.revision || 0) + (displayedDeletedCounts.free || 0)),
  }
  const animatedDeleted = useRampedCounters(deletedTargets, dashboardLoaded, { durationMs: 1200, maxSteps: 6, minIntervalMs: 60 });

  const completedTargets = {
    fullReportsDone: Number(fullReportsDone ?? 0),
    revisedCompleted: Number(revisedCompleted ?? 0),
    freeReportsCompleted: Number(freeReportsCompleted ?? 0),
  }
  const animatedCompleted = useRampedCounters(completedTargets, dashboardLoaded, { durationMs: 1200, maxSteps: 6, minIntervalMs: 60 });

  const txTargets = {
    total_bought_credits: Number(txTotals?.total_bought_credits ?? 0),
    total_spent_credits: Number(txTotals?.total_spent_credits ?? 0),
    total_subscription_usd: Number(txTotals?.total_subscription_usd ?? 0),
  }
  const animatedTx = useRampedCounters(txTargets, dashboardLoaded, { durationMs: 1400, maxSteps: 6, minIntervalMs: 80 });

  const creditsTargets = {
    subscriptionCredits: subscriptionCredits,
    purchasedCredits: purchasedCredits,
    effectiveCredits: effectiveCredits,
  }
  const animatedCredits = useRampedCounters(creditsTargets, dashboardLoaded, { durationMs: 1600, maxSteps: 6, minIntervalMs: 80 });

  React.useEffect(() => { return undefined }, [reportsRange.from, reportsRange.to])

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined
    try {
      const raw = window.localStorage.getItem('poliverai:deletedReports')
      if (!raw) return undefined
      const parsed = JSON.parse(raw) as { events?: Array<{ ts: number; counts: { full: number; revision: number; free: number } }>; legacyCounts?: { full?: number; revision?: number; free?: number } }
      setDeletedState({
        events: Array.isArray(parsed.events) ? parsed.events : [],
        legacyCounts: {
          full: Number(parsed.legacyCounts?.full ?? 0),
          revision: Number(parsed.legacyCounts?.revision ?? 0),
          free: Number(parsed.legacyCounts?.free ?? 0),
        },
      })
    } catch {
      return undefined
    }
    return undefined
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handler = (event: Event) => {
      try {
        const customEvent = event as CustomEvent<{ counts?: { full?: number; revision?: number; free?: number } }>
        const counts = customEvent.detail?.counts ?? {}
        const normalized = {
          full: Number(counts.full ?? 0),
          revision: Number(counts.revision ?? 0),
          free: Number(counts.free ?? 0),
        }
        setDeletedState((current) => {
          const next = {
            events: [...current.events, { ts: Date.now(), counts: normalized }],
            legacyCounts: {
              full: current.legacyCounts.full + normalized.full,
              revision: current.legacyCounts.revision + normalized.revision,
              free: current.legacyCounts.free + normalized.free,
            },
          }
          window.localStorage.setItem('poliverai:deletedReports', JSON.stringify(next))
          return next
        })
      } catch {
        // ignore
      }
    }
    window.addEventListener('reports:deleted', handler as EventListener)
    return () => window.removeEventListener('reports:deleted', handler as EventListener)
  }, [])

  React.useEffect(() => {
    if (loading || !isAuthenticated) {
      setTxTotals(null)
      return undefined
    }
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
  }, [isAuthenticated, loading, txRange.from, txRange.to])

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

  if (loading) return <View style={styles.centered}><Text>{t('dashboard.loading')}</Text></View>;
  if (!isAuthenticated) return <View style={styles.centered}><Text>{t('auth.not_authenticated') || 'Please sign in'}</Text></View>;

  return (
    <View style={styles.page}>
      <AppTopNav currentRoute="dashboard" />
      <ScrollView contentContainerStyle={styles.container}>
      <DashboardHeader name={typeof (user as { name?: string } | null)?.name === 'string' ? (user as { name?: string }).name : undefined} />

      <AccountStatus
        isPro={!!isPro}
        user={user ? { subscription_expires: (user as { subscription_expires?: string | null }).subscription_expires ?? null } : null}
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
        getCostForReport={(r?: unknown) => getCostForReport(r as ReportMetadata).credits}
        userReports={userReports}
        txTotals={txTotals ?? {}}
        totalSavedCredits={totalSavedCredits ?? 0}
        totalSavedUsd={totalSavedUsd ?? 0}
        formatRangeLabel={(range, from, to) => formatRangeLabel(range, from ?? '', to ?? '')}
        onRefresh={refreshUser}
      />

      <QuickActions reportsCount={reportsCount ?? undefined} />

      <AvailableFeatures hasCredits={hasCredits} />

      <GettingStarted />
      <AppFooter />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: rnTokens.pageBg.hex,
  },
  container: {
    padding: spacing.card.value ?? 16,
    paddingTop: 32,
    paddingBottom: 56,
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sectionPaddingY.value ?? 20,
  },
});
