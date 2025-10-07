import React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import useAuth from '@/contexts/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  FileCheck,
  BarChart,
  Clock,
  Shield,
  Zap,
  Upload,
  Star,
  CreditCard,
  Trash2,
  ArrowRight,
  RefreshCcw
} from 'lucide-react'
import PaymentsService from '@/services/payments'
import policyService from '@/services/policyService'
import type { ReportMetadata } from '@/types/api'
import transactionsService from '@/services/transactions'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { pushEvent, addToLegacy, computeDeletedCountsForRange } from '@/store/deletedReportsSlice'
import FeatureItem from '@/components/ui/FeatureItem'
import type { Feature } from '@/types/feature'
import { getDefaultMonthRange, getCost, getCostForReport, computeSavedTotals, computeDerivedFree, formatRangeLabel } from '@/lib/dashboardHelpers'
import useRampedCounters from '@/hooks/useRampedCounters'
import { computeTransactionTotals, isTransactionSuccess } from '@/lib/transactionHelpers'
import { safeDispatch } from '@/lib/eventHelpers'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

  // pricing helpers live in dashboardHelpers

export function Dashboard() {
  const { user, isAuthenticated, isPro, loading, refreshUser } = useAuth()
  const subscriptionCredits = (user?.subscription_credits ?? 0)
  const purchasedCredits = (user?.credits ?? 0)
  const effectiveCredits = subscriptionCredits + purchasedCredits
  const hasCredits = effectiveCredits > 0
  const navigate = useNavigate()
  
  

  // Report state: fetch user reports and compute counts/costs for dashboard
  const [userReports, setUserReports] = React.useState<ReportMetadata[] | null>(null)
  // Keep a server-driven count for free reports (faster when dataset large). Fallback to client computed value.
  // (removed server-driven free count; derive on the fly)
  // Date range state per-section (default to current month)
  const { from: defaultFrom, to: defaultTo } = getDefaultMonthRange()
  const [reportsRange, setReportsRange] = React.useState<{ from: string | null; to: string | null }>({ from: defaultFrom, to: defaultTo })
  const [completedRange, setCompletedRange] = React.useState<{ from: string | null; to: string | null }>({ from: defaultFrom, to: defaultTo })
  const [txRange, setTxRange] = React.useState<{ from: string | null; to: string | null }>({ from: defaultFrom, to: defaultTo })

  const [txTotals, setTxTotals] = React.useState<{ total_bought_credits?: number; total_spent_credits?: number; total_subscription_usd?: number; total_subscription_credits?: number } | null>(null)

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // pass date range for saved files view
        const respRaw = await policyService.getUserReports({ date_from: reportsRange.from, date_to: reportsRange.to })
        if (!mounted) return
        const resp = respRaw as unknown as { reports?: ReportMetadata[] } | ReportMetadata[]
        if (Array.isArray(resp)) setUserReports(resp)
        else setUserReports(resp.reports ?? [])
      } catch (e) {
        console.warn('Failed to fetch user reports for dashboard', e)
        if (mounted) setUserReports([])
      }
    })()
    return () => { mounted = false }
  }, [reportsRange.from, reportsRange.to])

  const { totalSavedFiles, fullReportsSaved, revisedDocsSaved, totalSavedCredits, totalSavedUsd, freeReportsSaved } = computeSavedTotals(userReports)
  const hasStatusField = !!(userReports && userReports.find((r) => typeof r.status !== 'undefined'))
  const fullReportsDone = userReports
    ? (hasStatusField ? userReports.filter((r) => r.is_full_report && (r.status === 'completed')).length : fullReportsSaved)
    : null
  const revisedCompleted = userReports
    ? (hasStatusField ? userReports.filter((r) => r.type === 'revision' && (r.status === 'completed')).length : revisedDocsSaved)
    : null
  const derivedFreeReportsSaved = computeDerivedFree(totalSavedFiles, fullReportsSaved, revisedDocsSaved)
  const freeReportsSavedDisplay = derivedFreeReportsSaved !== null ? derivedFreeReportsSaved : freeReportsSaved
  const freeReportsCompleted = userReports
    ? (hasStatusField ? userReports.filter((r) => (r.analysis_mode || '').toString() === 'fast' && (r.status === 'completed')).length : freeReportsSaved)
    : null

  // Deleted files tracking moved to Redux slice
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
      } catch (e) {
        console.warn('Failed to handle reports:deleted event', e)
      }
    }
    window.addEventListener('reports:deleted', handler as EventListener)
    return () => window.removeEventListener('reports:deleted', handler as EventListener)
  }, [dispatch])

  const displayedDeletedCounts = computeDeletedCountsForRange(deletedState.events, deletedState.legacyCounts, reportsRange)

  // When a dashboard "load" is complete: userReports and txTotals have been fetched
  const dashboardLoaded = !loading && (userReports !== null) && (txTotals !== null)

  // Saved files / totals (driven by userReports)
  const savedTargets = {
    totalSavedFiles: Number(totalSavedFiles ?? 0),
    fullReportsSaved: Number(fullReportsSaved ?? 0),
    revisedDocsSaved: Number(revisedDocsSaved ?? 0),
    freeReportsSaved: Number(freeReportsSavedDisplay ?? 0),
    totalSavedCredits: Number(totalSavedCredits ?? 0),
    totalSavedUsd: Number(totalSavedUsd ?? 0),
  }
  const animatedSaved = useRampedCounters(savedTargets, dashboardLoaded, { durationMs: 1400, maxSteps: 6, minIntervalMs: 60 })

  // Deleted files (from deleted state)
  const deletedTargets = {
    deletedFull: Number(displayedDeletedCounts.full ?? 0),
    deletedRevision: Number(displayedDeletedCounts.revision ?? 0),
    deletedFree: Number(displayedDeletedCounts.free ?? 0),
    deletedTotal: Number((displayedDeletedCounts.full || 0) + (displayedDeletedCounts.revision || 0) + (displayedDeletedCounts.free || 0)),
  }
  const animatedDeleted = useRampedCounters(deletedTargets, dashboardLoaded, { durationMs: 1200, maxSteps: 6, minIntervalMs: 60 })

  // Completed reports counts
  const completedTargets = {
    fullReportsDone: Number(fullReportsDone ?? 0),
    revisedCompleted: Number(revisedCompleted ?? 0),
    freeReportsCompleted: Number(freeReportsCompleted ?? 0),
  }
  const animatedCompleted = useRampedCounters(completedTargets, dashboardLoaded, { durationMs: 1200, maxSteps: 6, minIntervalMs: 60 })

  // Transaction totals
  const txTargets = {
    total_bought_credits: Number(txTotals?.total_bought_credits ?? 0),
    total_spent_credits: Number(txTotals?.total_spent_credits ?? 0),
    total_subscription_usd: Number(txTotals?.total_subscription_usd ?? 0),
  }
  const animatedTx = useRampedCounters(txTargets, dashboardLoaded, { durationMs: 1400, maxSteps: 6, minIntervalMs: 80 })

  // Animate the top credit numbers once the dashboard is loaded
  const creditsTargets = {
    subscriptionCredits: subscriptionCredits,
    purchasedCredits: purchasedCredits,
    effectiveCredits: effectiveCredits,
  }
  const animatedCredits = useRampedCounters(creditsTargets, dashboardLoaded, { durationMs: 1600, maxSteps: 6, minIntervalMs: 80 })

  // Prefer server-provided free count; fall back to derived value, then client-filtered free count
  // Prefer derived value, then client-filtered free count
  React.useEffect(() => {
    // derived free reports are computed from totals; no server call needed
    return undefined
  }, [reportsRange.from, reportsRange.to])

  // use formatRangeLabel from dashboardHelpers

  // Fetch transactions totals for Transaction Status panel when txRange changes
  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // fetch a reasonably large page of transactions in the selected date range
        const resp = await transactionsService.listTransactions({ page: 1, limit: 1000, date_from: txRange.from ?? undefined, date_to: txRange.to ?? undefined })
        if (!mounted) return
        const txs = resp.transactions ?? []
        const { total_bought_credits, total_spent_credits, total_subscription_usd, total_subscription_credits } = computeTransactionTotals(txs, resp)

        // Detailed debug logging to trace why subscription-credits might be missing
        try {
          console.debug('[Dashboard] transactions response summary', { count: txs.length, total_spent_credits: resp.total_spent_credits })
          // Log a compact view of each transaction relevant fields and our decision for it
          txs.forEach((t, i) => {
            const et = (t.event_type || '').toString().toLowerCase()
            const status = (t.status || '').toString()
            const credits = typeof t.credits === 'number' ? t.credits : 0
            const amount = typeof t.amount_usd === 'number' ? t.amount_usd : 0
            const success = isTransactionSuccess(t)
            const excludedFromBought = et.includes('subscription') || et.includes('subs') || et.includes('task')
            console.debug(`[Dashboard] tx[${i}] id=${t.id ?? '(no-id)'} event_type=${et} status=${status} credits=${credits} amount_usd=${amount} success=${success} excludedFromBought=${excludedFromBought}`)
          })
          console.debug('[Dashboard] totals computed', { total_bought_credits, total_subscription_credits, total_subscription_usd, total_spent_credits })
        } catch (logErr) {
          console.warn('[Dashboard] failed to emit transaction debug logs', logErr)
        }

        setTxTotals({ total_bought_credits: total_bought_credits || undefined, total_spent_credits: total_spent_credits || undefined, total_subscription_usd: total_subscription_usd || undefined, total_subscription_credits: total_subscription_credits || undefined })
      } catch (e) {
        console.warn('Failed to fetch transactions for dashboard', e)
        if (mounted) setTxTotals(null)
      }
    })()
    return () => { mounted = false }
  }, [txRange.from, txRange.to])


  // Refresh user when payment/transaction events occur elsewhere in the app
  React.useEffect(() => {
    const handler = () => {
      try {
        refreshUser().catch((e) => console.warn('Failed to refresh user from Dashboard event', e))
      } catch (e) {
        console.warn('Failed to call refreshUser', e)
      }
    }
    window.addEventListener('payment:refresh-user', handler)
    window.addEventListener('transactions:refresh', handler)
    return () => {
      window.removeEventListener('payment:refresh-user', handler)
      window.removeEventListener('transactions:refresh', handler)
    }
  }, [refreshUser])

  // Show a short splash after authentication to give a friendly transition.
  // Dashboard no longer uses the full-screen splash component — the Landing page controls that.

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message={"Loading your dashboard…"} size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const freeFeatures: Feature[] = [
    {
      icon: FileCheck,
      title: 'Policy Verification',
      description: 'Upload and analyze privacy policies with basic GDPR compliance checks',
      available: true,
    },
    {
      icon: Clock,
      title: 'Fast Analysis',
      description: 'Quick rule-based compliance screening',
      available: true,
    },
    {
      icon: Shield,
      title: 'Basic Recommendations',
      description: 'Get essential compliance improvement suggestions',
      available: true,
    },
  ]

  const proFeatures: Feature[] = [
    {
      icon: Zap,
      title: 'AI-Powered Analysis',
      description: 'Advanced AI analysis with nuanced violation detection',
      // Available if user is PRO or has credits
      available: isPro || hasCredits,
        key: 'analysis'
    },
    {
      icon: BarChart,
      title: 'Comprehensive Reports',
      description: 'Detailed PDF reports with confidence scores and evidence',
      available: isPro || hasCredits,
        key: 'report'
    },
    {
      icon: FileCheck,
      title: 'Policy Generation',
      description: 'Automatically generate revised compliant policies',
      available: isPro || hasCredits,
        key: 'ingest'
    },
  ]


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Manage your GDPR compliance analysis and reports from your dashboard.
          </p>
        </div>

        {/* Account Status */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className={`h-5 w-5 ${isPro ? 'text-blue-600' : 'text-green-600'}`} />
                  Account Status
                </CardTitle>
                <CardDescription>
                  You are currently on the {isPro ? 'Pro' : 'Free'} plan
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isPro
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {isPro ? 'PRO PLAN' : 'FREE PLAN'}
                </span>
                {!isPro && (
                  <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={async () => {
                        try {
                          await PaymentsService.purchaseUpgrade(29)
                          safeDispatch('payment:result', { success: true, title: 'Upgrade Successful', message: 'Your account is now PRO' })
                          window.location.reload()
                        } catch (err: unknown) {
                          console.error(err)
                          const msg = err instanceof Error ? err.message : String(err)
                          safeDispatch('payment:result', { success: false, title: 'Payment Failed', message: msg })
                        }
                      }}
                      icon={<ArrowRight className="h-4 w-4" />}
                      collapseToIcon
                    >
                      Upgrade to Pro
                    </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => refreshUser()} icon={<RefreshCcw className="h-4 w-4" />} collapseToIcon>
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          {!isPro && (
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Unlock Premium Features</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Get AI-powered deep analysis, comprehensive reporting, and policy generation
                  with our Pro plan starting at $29/month.
                </p>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={async () => {
                    try {
                      await PaymentsService.purchaseUpgrade(29)
                      window.dispatchEvent(new CustomEvent('payment:result', { detail: { success: true, title: 'Upgrade Successful', message: 'Your account is now PRO' } }))
                      window.location.reload()
                    } catch (err: unknown) {
                      console.error(err)
                      const msg = err instanceof Error ? err.message : String(err)
                      window.dispatchEvent(new CustomEvent('payment:result', { detail: { success: false, title: 'Payment Failed', message: msg } }))
                    }
                  }}
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Learn More
                </Button>
              </div>
            </CardContent>
          )}
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Subscription credits</div>
                <div className="text-xl font-semibold">{dashboardLoaded ? animatedCredits.subscriptionCredits : null}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Purchased credits</div>
                <div className="text-xl font-semibold">{dashboardLoaded ? animatedCredits.purchasedCredits : null}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total available</div>
                <div className="text-xl font-semibold">{dashboardLoaded ? animatedCredits.effectiveCredits : null}</div>
              </div>
            </div>
            {user?.subscription_expires && (
              <div className="mt-2 text-sm text-gray-500">Subscription expires: {new Date(user.subscription_expires).toLocaleDateString()}</div>
            )}
            <div className="mt-3 text-sm text-gray-600">
              <strong>How credits are used:</strong> Subscription credits are consumed first and each subscription credit covers {"~1.5"}x of a regular credit (discounted). If subscription credits run out, the system falls back to purchased credits which are charged at a slightly higher rate (penalty ~1.25x).
            </div>
            {/* New layer: Files saved status */}
            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2"><FileCheck className="h-4 w-4 text-gray-600" />Saved Files</h4>
                <div className="flex items-center gap-2">
                  <input type="date" value={reportsRange.from ?? ''} onChange={(e) => setReportsRange({ ...reportsRange, from: e.target.value || null })} className="border px-2 py-1 rounded text-sm" />
                  <input type="date" value={reportsRange.to ?? ''} onChange={(e) => setReportsRange({ ...reportsRange, to: e.target.value || null })} className="border px-2 py-1 rounded text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Total files saved</div>
                  <div className="text-lg font-semibold">{dashboardLoaded ? animatedSaved.totalSavedFiles : null}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total full reports saved</div>
                  <div className="text-lg font-semibold">{dashboardLoaded ? animatedSaved.fullReportsSaved : null}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total revised policies saved</div>
                  <div className="text-lg font-semibold">{dashboardLoaded ? animatedSaved.revisedDocsSaved : null}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total free reports saved</div>
                  <div className="text-lg font-semibold">{dashboardLoaded ? animatedSaved.freeReportsSaved : null}</div>
                </div>
              </div>

              {/* Deleted files track record */}
              <div className="mb-4 mt-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2"><Trash2 className="h-4 w-4 text-gray-600" />Deleted Files</h4>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Deleted full reports</div>
                    <div className="text-lg font-semibold">{dashboardLoaded ? animatedDeleted.deletedFull : null}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Deleted revised policies</div>
                    <div className="text-lg font-semibold">{dashboardLoaded ? animatedDeleted.deletedRevision : null}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Deleted free reports</div>
                    <div className="text-lg font-semibold">{dashboardLoaded ? animatedDeleted.deletedFree : null}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total deleted files</div>
                    <div className="text-lg font-semibold">{dashboardLoaded ? animatedDeleted.deletedTotal : null}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <strong>How limit results by date:</strong> Use the "Saved Files" date picker at the top of this card to narrow the Saved Files and Deleted Files counts to a specific range. The dashboard filters deletion events recorded in this browser. If no per-event data is available (older installs), the dashboard falls back to legacy all-time totals stored locally.
              </div>
              <div className="mt-3 text-sm text-gray-600">Estimated cost: <span className="font-semibold">{totalSavedCredits !== null ? `${totalSavedCredits} credits` : '—'}</span> (<span className="font-semibold">{totalSavedUsd !== null ? `$${totalSavedUsd.toFixed(2)}` : '—'}</span>)</div>
              <div className="mt-1 text-xs text-gray-500">{formatRangeLabel(reportsRange, defaultFrom, defaultTo)}</div>
            </div>

            {/* New layer: Completed reports */}
            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2"><BarChart className="h-4 w-4 text-gray-600" />Completed Reports</h4>
                <div className="flex items-center gap-2">
                  <input type="date" value={completedRange.from ?? ''} onChange={(e) => setCompletedRange({ ...completedRange, from: e.target.value || null })} className="border px-2 py-1 rounded text-sm" />
                  <input type="date" value={completedRange.to ?? ''} onChange={(e) => setCompletedRange({ ...completedRange, to: e.target.value || null })} className="border px-2 py-1 rounded text-sm" />
                </div>
              </div>
                <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Full reports completed</div>
                  <div className="text-lg font-semibold">{dashboardLoaded ? animatedCompleted.fullReportsDone : null}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Revised policies completed</div>
                  <div className="text-lg font-semibold">{dashboardLoaded ? animatedCompleted.revisedCompleted : null}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">Free reports completed</div>
                  <div className="text-lg font-semibold">{dashboardLoaded ? animatedCompleted.freeReportsCompleted : null}</div>
                  <div className="text-xs text-gray-500">Cost per free report: 0 credits</div>
                </div>
              </div>
              {/* Costs for completed items: compute credits & usd for completed subset if statuses available */}
              {userReports ? (
                <div className="mt-3 text-sm text-gray-600">
                  Estimated completed cost: <span className="font-semibold">{
                    (() => {
                      const completed = userReports.filter((r) => {
                        if (typeof r.status !== 'undefined') return r.status === 'completed'
                        // fallback: consider saved items as completed
                        return true
                      })
                      const creds = completed.reduce((acc, r) => acc + getCostForReport(r).credits, 0)
                      return `${creds} credits`
                    })()
                  }</span> (<span className="font-semibold">{
                    (() => {
                      const completed = userReports.filter((r) => {
                        if (typeof r.status !== 'undefined') return r.status === 'completed'
                        return true
                      })
                      const usd = completed.reduce((acc, r) => acc + getCostForReport(r).usd, 0)
                      return `$${usd.toFixed(2)}`
                    })()
                  }</span>)
                </div>
              ) : null}
              <div className="mt-1 text-xs text-gray-500">{formatRangeLabel(completedRange, defaultFrom, defaultTo)}</div>
            </div>

            {/* Transaction Status (credits bought/spent/subscriptions) */}
            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-600" />Transaction Status</h4>
                <div className="flex items-center gap-2">
                  <input type="date" value={txRange.from ?? ''} onChange={(e) => setTxRange({ ...txRange, from: e.target.value || null })} className="border px-2 py-1 rounded text-sm" />
                  <input type="date" value={txRange.to ?? ''} onChange={(e) => setTxRange({ ...txRange, to: e.target.value || null })} className="border px-2 py-1 rounded text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Total credits bought</div>
                  <div className="text-lg font-semibold">{dashboardLoaded ? animatedTx.total_bought_credits : null}</div>
                  <div className="text-sm text-gray-500">{dashboardLoaded && txTotals?.total_bought_credits ? `${txTotals.total_bought_credits} credits` : ''}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total credits spent</div>
                  <div className="text-lg font-semibold">{dashboardLoaded ? animatedTx.total_spent_credits : null}</div>
                  <div className="text-sm text-gray-500">{dashboardLoaded && txTotals?.total_spent_credits ? `${txTotals.total_spent_credits} credits` : ''}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total subscription payments (USD)</div>
                  <div className="text-lg font-semibold">{dashboardLoaded && txTotals?.total_subscription_usd ? `$${animatedTx.total_subscription_usd.toFixed(2)}` : null}</div>
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-500">{formatRangeLabel(txRange, defaultFrom, defaultTo)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/analyze')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Upload className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Analyze New Policy</CardTitle>
                    <CardDescription>
                      Upload a privacy policy for GDPR compliance analysis
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {isPro && (
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/reports')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BarChart className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">View Reports</CardTitle>
                      <CardDescription>
                        Access your detailed compliance reports and history
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>

        {/* Available Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Features</h2>

          {/* Free Features */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Free Tier Features
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {freeFeatures.map((feature, index) => (
                <Card key={index} className="h-full">
                  <CardHeader className="pb-2">
                    <FeatureItem feature={feature} />
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Pro Features */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Pro Plan Features
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {proFeatures.map((feature, index) => (
                <Card key={index} className="h-full">
                  <CardHeader className="pb-2">
                    <FeatureItem feature={feature} getCost={getCost} />
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              New to PoliverAI? Here's how to get the most out of your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Upload Your First Policy</h4>
                  <p className="text-sm text-gray-600">
                    Start by uploading a privacy policy document to analyze for GDPR compliance
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Review Analysis Results</h4>
                  <p className="text-sm text-gray-600">
                    Examine compliance scores, violations, and recommendations for improvement
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium">
                    {isPro ? 'Generate Reports' : 'Consider Upgrading'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {isPro
                      ? 'Create detailed compliance reports and generate revised policies'
                      : 'Upgrade to Pro for advanced AI analysis and comprehensive reporting'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
