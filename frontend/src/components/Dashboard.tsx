import React from 'react'
import { t } from '@/i18n'
import { Navigate } from 'react-router-dom'
import useAuth from '@/contexts/useAuth'
import { getDefaultMonthRange, getCost, getCostForReport, computeSavedTotals, computeDerivedFree, formatRangeLabel as _formatRangeLabel } from '@/lib/dashboardHelpers'
import useRampedCounters from '@/hooks/useRampedCounters'
import { computeTransactionTotals } from '@/lib/transactionHelpers'
import transactionsService from '@/services/transactions'
import policyService from '@/services/policyService'
import type { ReportMetadata } from '@/types/api'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { pushEvent, addToLegacy, computeDeletedCountsForRange } from '@/store/deletedReportsSlice'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { twFromTokens, spacing, colors } from '@/styles/styleTokens'
import QuickActions from '@/components/dashboard/QuickActions'
import AvailableFeatures from '@/components/dashboard/AvailableFeatures'
import GettingStarted from '@/components/dashboard/GettingStarted'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import AccountStatus from '@/components/dashboard/AccountStatus'

const formatRangeLabel = (range: { from: string | null; to: string | null } | null, defFrom: string | null, defTo: string | null) => _formatRangeLabel(range, defFrom ?? '', defTo ?? '')

type DashboardUser = { subscription_credits?: number; credits?: number; subscription_expires?: string | null } | null

export default function Dashboard(): React.ReactElement {
  const { user, isAuthenticated, isPro, loading, refreshUser, reportsCount } = useAuth()

  const subscriptionCredits = (user?.subscription_credits ?? 0)
  const purchasedCredits = (user?.credits ?? 0)
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
  const hasStatusField = !!((userReports && userReports.find((r) => typeof r.status !== 'undefined')) || (completedReports && completedReports.find((r) => typeof r.status !== 'undefined')))

  const fullReportsDone = (completedReports !== null)
    ? (hasStatusField ? completedReports.filter((r) => r.is_full_report && (r.status === 'completed')).length : (completedReports.filter((r) => !!r.is_full_report).length))
    : (userReports ? (hasStatusField ? userReports.filter((r) => r.is_full_report && (r.status === 'completed')).length : fullReportsSaved) : null)

  const revisedCompleted = (completedReports !== null)
    ? (hasStatusField ? completedReports.filter((r) => r.type === 'revision' && (r.status === 'completed')).length : (completedReports.filter((r) => r.type === 'revision').length))
    : (userReports ? (hasStatusField ? userReports.filter((r) => r.type === 'revision' && (r.status === 'completed')).length : revisedDocsSaved) : null)

  const derivedFreeReportsSaved = computeDerivedFree(totalSavedFiles, fullReportsSaved, revisedDocsSaved)
  const freeReportsSavedDisplay = derivedFreeReportsSaved !== null ? derivedFreeReportsSaved : freeReportsSaved
  const freeReportsCompleted = userReports
    ? (hasStatusField ? userReports.filter((r) => (r.analysis_mode || '').toString() === 'fast' && (r.status === 'completed')).length : freeReportsSaved)
    : null

  const dispatch = useAppDispatch()
  const deletedState = useAppSelector((s) => s.deletedReports)

  React.useEffect(() => {
    const handler = (ev: Event) => {
      try {
        const ce = ev as CustomEvent
        const counts = (ce.detail && (ce.detail.counts as { full?: number; revision?: number; free?: number }))
        const filenames = (ce.detail && (ce.detail.filenames as string[])) || undefined

        const eventCounts = counts ? {
          full: counts.full || 0,
          revision: counts.revision || 0,
          free: counts.free || 0,
        } : (filenames ? { full: 0, revision: 0, free: filenames.length } : { full: 0, revision: 0, free: 0 })

        const evObj = { ts: Date.now(), counts: eventCounts, filenames }
        dispatch(pushEvent(evObj))
        dispatch(addToLegacy(eventCounts))
      } catch {
        // ignore
      }
    }
    window.addEventListener('reports:deleted', handler as EventListener)
    return () => window.removeEventListener('reports:deleted', handler as EventListener)
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
        refreshUser().catch(() => {})
      } catch {
        // ignore
      }
    }
    window.addEventListener('payment:refresh-user', handler)
    window.addEventListener('transactions:refresh', handler)
    return () => { window.removeEventListener('payment:refresh-user', handler); window.removeEventListener('transactions:refresh', handler) }
  }, [refreshUser])

  if (loading) return <div className={twFromTokens(spacing.fullScreenCenter)}><LoadingSpinner message={t('dashboard.loading')} size="lg" /></div>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className={twFromTokens('min-h-screen', colors.pageBg)}>
      <div className={twFromTokens(spacing.mainContainer)}>
        <DashboardHeader />

        <AccountStatus
          isPro={isPro}
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
          getCostForReport={getCostForReport}
          userReports={userReports}
          txTotals={txTotals}
          totalSavedCredits={totalSavedCredits}
          totalSavedUsd={totalSavedUsd}
          formatRangeLabel={formatRangeLabel}
        />

        <QuickActions reportsCount={reportsCount ?? undefined} />

        <AvailableFeatures getCost={getCost} hasCredits={hasCredits} />

        <GettingStarted />
      </div>
    </div>
  )
}

