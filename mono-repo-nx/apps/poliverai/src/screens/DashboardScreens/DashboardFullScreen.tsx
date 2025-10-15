import React from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useAuth, t, getDefaultMonthRange, ReportMetadata, computeSavedTotals, getCostForReport, formatRangeLabel, getCost, computeDerivedFree, transactionsService, computeTransactionTotals, policyService } from '@poliverai/intl';
import { AccountStatus, QuickActions, AvailableFeatures, GettingStarted, DashboardHeader, colors as rnTokens, spacing } from '@poliverai/shared-ui';

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

  // TODO: Wire up Redux dispatch/selectors for RN, stub for now

  // TODO: Port computeDeletedCountsForRange from frontend/src/lib if needed
  const displayedDeletedCounts = { full: 0, revision: 0, free: 0 };

  const dashboardLoaded = !loading && (userReports !== null) && (txTotals !== null) && (completedReports !== null)

  const savedTargets = {
    totalSavedFiles: Number(totalSavedFiles ?? 0),
    fullReportsSaved: Number(fullReportsSaved ?? 0),
    revisedDocsSaved: Number(revisedDocsSaved ?? 0),
    freeReportsSaved: Number(freeReportsSavedDisplay ?? 0),
    totalSavedCredits: Number(totalSavedCredits ?? 0),
    totalSavedUsd: Number(totalSavedUsd ?? 0),
  }
    // TODO: Port useRampedCounters from frontend/src/lib if needed
    const animatedSaved = savedTargets;

  const deletedTargets = {
    deletedFull: Number(displayedDeletedCounts.full ?? 0),
    deletedRevision: Number(displayedDeletedCounts.revision ?? 0),
    deletedFree: Number(displayedDeletedCounts.free ?? 0),
    deletedTotal: Number((displayedDeletedCounts.full || 0) + (displayedDeletedCounts.revision || 0) + (displayedDeletedCounts.free || 0)),
  }
    const animatedDeleted = deletedTargets;

  const completedTargets = {
    fullReportsDone: Number(fullReportsDone ?? 0),
    revisedCompleted: Number(revisedCompleted ?? 0),
    freeReportsCompleted: Number(freeReportsCompleted ?? 0),
  }
    const animatedCompleted = completedTargets;

  const txTargets = {
    total_bought_credits: Number(txTotals?.total_bought_credits ?? 0),
    total_spent_credits: Number(txTotals?.total_spent_credits ?? 0),
    total_subscription_usd: Number(txTotals?.total_subscription_usd ?? 0),
  }
    const animatedTx = txTargets;

  const creditsTargets = {
    subscriptionCredits: subscriptionCredits,
    purchasedCredits: purchasedCredits,
    effectiveCredits: effectiveCredits,
  }
    const animatedCredits = creditsTargets;

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

  if (loading) return <View style={styles.centered}><Text>{t('dashboard.loading')}</Text></View>;
  if (!isAuthenticated) return <View style={styles.centered}><Text>{t('auth.not_authenticated') || 'Please sign in'}</Text></View>;

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container}>
      <DashboardHeader />

      <AccountStatus
        isPro={!!isPro}
        user={user}
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
        getCostForReport={(r: ReportMetadata) => getCostForReport(r).credits}
        userReports={userReports}
        txTotals={txTotals ?? {}}
        totalSavedCredits={totalSavedCredits ?? 0}
        totalSavedUsd={totalSavedUsd ?? 0}
        formatRangeLabel={formatRangeLabel}
      />

      <QuickActions reportsCount={reportsCount ?? undefined} />

      <AvailableFeatures getCost={(feature) => getCost(feature?.key) ? getCost(feature?.key)?.credits ?? 0 : 0} hasCredits={hasCredits} />

      <GettingStarted />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: rnTokens.pageBg.hex,
  },
  container: {
    padding: spacing.card.value ?? 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sectionPaddingY.value ?? 20,
  },
});
