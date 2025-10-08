import { useEffect, useState, useMemo, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '@/contexts/useAuth'
import transactionsService from '@/services/transactions'
import PaymentsService from '@/services/payments'
import EnterCreditsModal from '@/components/ui/EnterCreditsModal'
import useRampedCounters from '@/hooks/useRampedCounters'
import usePaymentResult from '@/components/ui/PaymentResultHook'
import type { Transaction } from '@/services/transactions'
import type { TransactionStatus, StatusFilter } from '@/types/transaction'
import { X, ChevronLeft, ChevronRight, RefreshCcw, Shield, CreditCard, DollarSign, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import MetaLine from '@/components/ui/MetaLine'
import StatusFilterItem from '@/components/ui/StatusFilterItem'
import TransactionCard from '@/components/ui/TransactionCard'
import { store } from '@/store/store'
import { clearPendingCheckout } from '@/store/paymentsSlice'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import NoDataView from '@/components/ui/NoDataView'

export default function Credits() {
  const { user, isAuthenticated, loading, refreshUser } = useAuth()
  const [items, setItems] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>({ pending: true, success: true, failed: true, processing: true, insufficient_funds: true, unknown: true, task: true })
  const [progress, setProgress] = useState<number>(0)
  const [showBar, setShowBar] = useState<boolean>(false)
  const paymentResult = usePaymentResult()
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [total, setTotal] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalSpentCredits, setTotalSpentCredits] = useState<number>(0)
  const [isMobile, setIsMobile] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth <= 1140 : false))
  const [filtersOpen, setFiltersOpen] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth > 1140 : true))
  const [isWide1276, setIsWide1276] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth > 1276 : true))
  const [isCompactUnderHeader, setIsCompactUnderHeader] = useState<boolean>(() => (typeof window !== 'undefined' ? (window.innerWidth > 768 && window.innerWidth <= 1276) : false))

  
  

  // Animate a simple loading progress bar while isLoading is true
  useEffect(() => {
    let interval: number | undefined
    let timeout: number | undefined
    if (isLoading) {
      setShowBar(true)
      setProgress(10)
      interval = window.setInterval(() => {
        setProgress((p) => Math.min(90, Math.round(p + Math.random() * 12)))
      }, 400) as unknown as number
    } else {
      // complete and hide shortly after
      setProgress(100)
      timeout = window.setTimeout(() => setShowBar(false), 700) as unknown as number
    }
    return () => {
      if (interval) clearInterval(interval)
      if (timeout) clearTimeout(timeout)
    }
  }, [isLoading])

  const fetchTx = useCallback(async () => {
    setIsLoading(true)
    try {
      const r = await transactionsService.listTransactions({ page, limit })
      setItems(r.transactions || [])
      setTotal(r.total ?? (r.transactions?.length ?? 0))
      setTotalPages(r.total_pages ?? 1)
      setTotalSpentCredits(r.total_spent_credits ?? 0)
    } catch (e) {
      console.error('Failed to load transactions', e)
      setError('Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }, [page, limit])
  // Call fetchTx initially and when page/limit change
  useEffect(() => {
    fetchTx()
  }, [fetchTx])

  // Track viewport width to control mobile behavior for filters
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 1140
      setIsMobile(mobile)
      setIsWide1276(window.innerWidth > 1276)
      setIsCompactUnderHeader(window.innerWidth > 768 && window.innerWidth <= 1276)
      // Auto-close filters on mobile, open on desktop
      setFiltersOpen(!mobile)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Listen for external refresh events (transactions refreshed elsewhere in the app)
  useEffect(() => {
    const h = () => {
      fetchTx().catch((e) => console.error('Failed to refresh transactions', e))
      if (refreshUser) {
        refreshUser().catch((e) => console.error('Failed to refresh user from transactions event', e))
      }
    }
    window.addEventListener('transactions:refresh', h)
    return () => window.removeEventListener('transactions:refresh', h)
  }, [refreshUser, fetchTx])
  
  // Ramped counters for top totals: wait until auth and transactions have finished loading
  const subscriptionCreditsTop = user?.subscription_credits ?? 0
  const purchasedCreditsTop = user?.credits ?? 0
  const totalSpentTop = totalSpentCredits ?? 0
  const statsLoaded = !loading && !isLoading
  const animatedTop = useRampedCounters({ subscriptionCredits: subscriptionCreditsTop, purchasedCredits: purchasedCreditsTop, totalSpent: totalSpentTop }, statsLoaded, { durationMs: 1400, maxSteps: 6, minIntervalMs: 60 })
  const getTxStatus = (t: Transaction): TransactionStatus => {
    const s = t.status
    const et = (t.event_type || '').toString().toLowerCase()
    const desc = (t.description || '').toString().toLowerCase()
    if (s === 'pending' || et.includes('pending')) return 'pending'
    if (s === 'completed' || et.includes('completed') || (typeof t.credits === 'number' && t.credits !== 0)) return 'success'
    if (et.includes('failed') || desc.includes('failed') || desc.includes('declined') || desc.includes('payment_failed')) return 'failed'
    if (desc.includes('insufficient') || desc.includes('insufficient_funds') || desc.includes('insufficient_fund')) return 'insufficient_funds'
    if (et.includes('processing') || desc.includes('processing')) return 'processing'
    return 'task'
  }

  const statusBadge = (status: TransactionStatus) => {
    switch (status) {
      case 'pending':
        return <span className="inline-block text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Pending</span>
      case 'success':
        return <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Success</span>
      case 'failed':
        return <span className="inline-block text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">Failed</span>
      default:
        return <span className="inline-block text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">{status}</span>
    }
  }

  const failureBadge = (failure_code?: string | null, failure_message?: string | null) => {
    if (!failure_code) return null
    const map: Record<string, string> = {
      'card_declined': 'Card Declined',
      'insufficient_funds': 'Insufficient Funds',
      'lost_card': 'Lost Card',
      'stolen_card': 'Stolen Card',
      'expired_card': 'Expired Card',
      'incorrect_cvc': 'Incorrect CVC',
      'processing_error': 'Processing Error',
      'incorrect_number': 'Incorrect Number',
      'card_velocity_exceeded': 'Velocity Exceeded',
    }
    const label = map[failure_code] || failure_code
    return (
      <div className="mt-2">
        <span className="inline-block text-xs px-2 py-1 rounded-full bg-red-50 text-red-700">{label}</span>
        <MetaLine>{failure_message}</MetaLine>
      </div>
    )
  }

  const filtered = useMemo<Transaction[]>(() => {
    const sfKeys = (Object.keys(statusFilter) as TransactionStatus[]).filter((k) => statusFilter[k])
    return items.filter((t) => {
      // status filter
      const st = getTxStatus(t)
      if (!sfKeys.includes(st)) return false

      // search filter
      const q = search.trim().toLowerCase()
      if (q) {
        const hay = `${t.description || ''} ${t.event_type || ''} ${t.session_id || ''} ${t.user_email || ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }

      // date filters (timestamps are ISO strings)
      if (dateFrom) {
        const from = new Date(dateFrom)
        const ts = t.timestamp ? new Date(t.timestamp) : null
        if (!ts || ts < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo)
        // include whole day
        to.setHours(23, 59, 59, 999)
        const ts = t.timestamp ? new Date(t.timestamp) : null
        if (!ts || ts > to) return false
      }

      return true
    })
  }, [items, search, dateFrom, dateTo, statusFilter])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="p-8 flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Transaction History</h1>

        <div className="flex items-center gap-3">
          {/* Show filters toggle on mobile */}
          {isMobile && (
            <Button size="sm" variant="outline" icon={<Filter className="h-4 w-4" />} onClick={() => setFiltersOpen((s) => !s)} collapseToIcon>
              {filtersOpen ? 'Hide filters' : 'Show filters'}
            </Button>
          )}

          {/* On wide screens (>1276) show a compact credits summary inline */}
          {isWide1276 && (() => {
            const subscriptionCredits = user?.subscription_credits ?? 0
            const purchasedCredits = user?.credits ?? 0
            const total = subscriptionCredits + purchasedCredits
            const subscriptionUsd = (subscriptionCredits / 10)
            const purchasedUsd = (purchasedCredits / 10)
            const spentCredits = totalSpentCredits ?? 0
            const spentUsd = spentCredits / 10

            return (
              <div className="flex items-center gap-4">
                <div className={`bg-white rounded shadow text-sm flex items-center gap-3 ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                  <div className={`flex-shrink-0 bg-blue-50 rounded-md flex items-center justify-center ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                    <Shield className={`${isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10'} text-blue-600`} />
                  </div>
                  <div>
                    <div className="text-gray-600">Subscription Credits</div>
                    <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{statsLoaded ? animatedTop.subscriptionCredits : null} credits</div>
                    {!isCompactUnderHeader && <div className="text-xs text-gray-500">${subscriptionUsd.toFixed(2)} USD equivalent</div>}
                  </div>
                </div>

                <div className={`bg-white rounded shadow text-sm flex items-center gap-3 ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                  <div className={`flex-shrink-0 bg-gray-50 rounded-md flex items-center justify-center ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                    <CreditCard className={`${isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10'} text-gray-700`} />
                  </div>
                  <div>
                    <div className="text-gray-600">Purchased Credits</div>
                    <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{statsLoaded ? animatedTop.purchasedCredits : null} credits</div>
                    {!isCompactUnderHeader && <div className="text-xs text-gray-500">${purchasedUsd.toFixed(2)} USD equivalent</div>}
                    {!isCompactUnderHeader && <div className="text-xs text-gray-500">Total available: {total} credits</div>}
                  </div>
                </div>

                <div className={`bg-white rounded shadow text-sm flex items-center gap-3 ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                  <div className={`flex-shrink-0 bg-red-50 rounded-md flex items-center justify-center ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                    <DollarSign className={`${isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10'} text-red-600`} />
                  </div>
                  <div>
                    <div className="text-gray-600">Total Spent</div>
                    <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{statsLoaded ? animatedTop.totalSpent : null} credits</div>
                    {!isCompactUnderHeader && <div className="text-xs text-gray-500">${spentUsd.toFixed(2)} USD spent</div>}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>

      {/* If not wide, render the full credits breakdown below the header */}
      {!isWide1276 && (
        <div className="mb-4">
          {(() => {
            const subscriptionCredits = user?.subscription_credits ?? 0
            const purchasedCredits = user?.credits ?? 0
            const total = subscriptionCredits + purchasedCredits
            const subscriptionUsd = (subscriptionCredits / 10)
            const purchasedUsd = (purchasedCredits / 10)
            const spentCredits = totalSpentCredits ?? 0
            const spentUsd = spentCredits / 10

            // For smallest screens (isMobile) render a compact horizontal bar with smaller icons/text
            if (isMobile) {
              return (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 bg-blue-50 rounded-md flex items-center justify-center p-2`}> 
                      <Shield className={`h-6 w-6 text-blue-600`} />
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-600">Subscription</div>
                      <div className="font-semibold text-sm">{statsLoaded ? animatedTop.subscriptionCredits : null} credits</div>
                      <div className="text-xs text-gray-500">${subscriptionUsd.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 bg-gray-50 rounded-md flex items-center justify-center p-2`}>
                      <CreditCard className={`h-6 w-6 text-gray-700`} />
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-600">Purchased</div>
                      <div className="font-semibold text-sm">{statsLoaded ? animatedTop.purchasedCredits : null} credits</div>
                      <div className="text-xs text-gray-500">${purchasedUsd.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 bg-red-50 rounded-md flex items-center justify-center p-2`}>
                      <DollarSign className={`h-6 w-6 text-red-600`} />
                    </div>
                    <div className="text-sm">
                      <div className="text-gray-600">Total Spent</div>
                      <div className="font-semibold text-sm">{statsLoaded ? animatedTop.totalSpent : null} credits</div>
                      <div className="text-xs text-gray-500">${spentUsd.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )
            }

            // For narrow-but-not-mobile layouts keep the previous stacked layout
            return (
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className={`bg-white rounded shadow text-sm flex items-center gap-4 ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                  <div className={`flex-shrink-0 bg-blue-50 rounded-md flex items-center justify-center ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                    <Shield className={`${isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10'} text-blue-600`} />
                  </div>
                  <div>
              <div className="text-gray-600">Subscription Credits</div>
              <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{statsLoaded ? animatedTop.subscriptionCredits : null} credits</div>
                    {!isCompactUnderHeader && <div className="text-xs text-gray-500">${subscriptionUsd.toFixed(2)} USD equivalent</div>}
                  </div>
                </div>

                <div className={`bg-white rounded shadow text-sm flex items-center gap-4 ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                  <div className={`flex-shrink-0 bg-gray-50 rounded-md flex items-center justify-center ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                    <CreditCard className={`${isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10'} text-gray-700`} />
                  </div>
                  <div>
                    <div className="text-gray-600">Purchased Credits</div>
                    <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{statsLoaded ? animatedTop.purchasedCredits : null} credits</div>
                    {!isCompactUnderHeader && <div className="text-xs text-gray-500">${purchasedUsd.toFixed(2)} USD equivalent</div>}
                    {!isCompactUnderHeader && <div className="text-xs text-gray-500">Total available: {total} credits</div>}
                  </div>
                </div>

                <div className={`bg-white rounded shadow text-sm flex items-center gap-4 ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                  <div className={`flex-shrink-0 bg-red-50 rounded-md flex items-center justify-center ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                    <DollarSign className={`${isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10'} text-red-600`} />
                  </div>
                  <div>
                    <div className="text-gray-600">Total Spent</div>
                    <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{statsLoaded ? animatedTop.totalSpent : null} credits</div>
                    {!isCompactUnderHeader && <div className="text-xs text-gray-500">${spentUsd.toFixed(2)} USD spent</div>}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
      {/* Mobile: show a compact progress bar here too so it's visible even when filters are hidden */}
      {isMobile && showBar && (
        <div className="mb-4">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-300 ease-out ${progress < 5 ? 'opacity-90 animate-pulse' : ''}`}
              style={{ width: progress < 5 ? '25%' : `${Math.min(100, Math.max(2, progress))}%` }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(100, Math.max(0, progress))}
            />
          </div>
        </div>
      )}
      <EnterCreditsModal
        open={showModal}
        onClose={() => setShowModal(false)}
            onConfirm={async (amount_usd: number) => {
          try {
            await PaymentsService.purchaseCredits(amount_usd)
            paymentResult.show('success', 'Credits Purchase Successful', `Added ${(amount_usd * 10).toFixed(0)} credits`)
            // Refresh transactions and user
            await fetchTx()
                // refresh current user so balance updates
                try { await refreshUser() } catch (e) { console.error('Failed to refresh user after credit purchase', e) }
                // short delay to let credits update
                setTimeout(() => {}, 500)
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            paymentResult.show('failed', 'Credits Purchase Failed', msg)
          }
        }}
      />
  {error && <div className="text-red-600">{error}</div>}

      <div className={`flex-1 ${isMobile ? 'flex flex-col' : 'flex gap-6'}`}>
        {/* Sidebar filters: render as sidebar on desktop, as collapsible block above list on mobile */}
        {isMobile ? (
          filtersOpen ? (
            <div className="w-full p-4 border rounded bg-white mb-4">
              {/* ...existing filter contents... */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Search</label>
                <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border px-2 py-1 rounded" placeholder="description, session id, email..." />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Date from</label>
                <input type="date" value={dateFrom ?? ''} onChange={(e) => setDateFrom(e.target.value || null)} className="w-full border px-2 py-1 rounded" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Date to</label>
                <input type="date" value={dateTo ?? ''} onChange={(e) => setDateTo(e.target.value || null)} className="w-full border px-2 py-1 rounded" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Status</label>
                {(Object.keys(statusFilter) as TransactionStatus[]).map((key) => {
                  return (
                    <div key={key} className="mb-1">
                      <StatusFilterItem name={key} checked={!!statusFilter[key]} onChange={(n) => setStatusFilter((s) => ({ ...s, [n]: !s[n] }))} />
                    </div>
                  )
                })}
              </div>
              <div>
                <Button className="w-full bg-gray-100 text-white px-3 py-1 rounded" iconColor="text-white" onClick={() => { setSearch(''); setDateFrom(null); setDateTo(null); setStatusFilter({ pending: true, success: true, failed: true, processing: true, insufficient_funds: true, unknown: true, task: true }) }} icon={<X className="h-4 w-4" />} collapseToIcon>
                  Clear
                </Button>
              </div>
              <div className="mt-2">
                <Button className="w-full bg-green-600 text-white px-3 py-1 rounded" onClick={async () => { try { await fetchTx(); try { await refreshUser() } catch { /* ignore */ } } catch (e) { console.error('refresh failed', e) } }} icon={<RefreshCcw className="h-4 w-4" />} collapseToIcon>
                  Refresh
                </Button>
              </div>
              <div className="mt-4">
                {showBar && (
                  <div className="w-full">
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-300 ease-out ${progress < 5 ? 'opacity-90 animate-pulse' : ''}`}
                        style={{ width: progress < 5 ? '25%' : `${Math.min(100, Math.max(2, progress))}%` }}
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.min(100, Math.max(0, progress))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null
        ) : (
          <aside className="w-64 p-4 border rounded bg-white">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Search</label>
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border px-2 py-1 rounded" placeholder="description, session id, email..." />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Date from</label>
              <input type="date" value={dateFrom ?? ''} onChange={(e) => setDateFrom(e.target.value || null)} className="w-full border px-2 py-1 rounded" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Date to</label>
              <input type="date" value={dateTo ?? ''} onChange={(e) => setDateTo(e.target.value || null)} className="w-full border px-2 py-1 rounded" />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Status</label>
              {(Object.keys(statusFilter) as TransactionStatus[]).map((key) => {
                return (
                  <div key={key} className="mb-1">
                    <StatusFilterItem name={key} checked={!!statusFilter[key]} onChange={(n) => setStatusFilter((s) => ({ ...s, [n]: !s[n] }))} />
                  </div>
                )
              })}
            </div>
            <div>
              <Button className="w-full bg-gray-100 text-black px-3 py-1 rounded" onClick={() => { setSearch(''); setDateFrom(null); setDateTo(null); setStatusFilter({ pending: true, success: true, failed: true, processing: true, insufficient_funds: true, unknown: true, task: true }) }} icon={<X className="h-4 w-4" />} collapseToIcon>
                Clear
              </Button>
            </div>
            <div className="mt-2">
              <Button className="w-full bg-green-600 text-white px-3 py-1 rounded" onClick={async () => { try { await fetchTx(); try { await refreshUser() } catch { /* ignore */ } } catch (e) { console.error('refresh failed', e) } }} icon={<RefreshCcw className="h-4 w-4" />} collapseToIcon>
                Refresh
              </Button>
            </div>

            {/* Progress bar for loading transactions */}
            <div className="mt-4">
              {showBar && (
                <div className="w-full">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-300 ease-out ${progress < 5 ? 'opacity-90 animate-pulse' : ''}`}
                      style={{ width: progress < 5 ? '25%' : `${Math.min(100, Math.max(2, progress))}%` }}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(100, Math.max(0, progress))}
                    />
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* List area */}
        <div className="flex-1 flex flex-col">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <LoadingSpinner message="Loading transactions…" subtext="This may take a moment — fetching your transaction history." size="lg" />
            </div>
          ) : (
            <>
            <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-gray-600"><span className="hidden sm:inline">Showing </span>{filtered.length} of {total ?? items.length}<span className="hidden sm:inline"> transactions</span></div>
            <div className="flex items-center gap-3">
              {!isMobile && <label className="text-sm text-gray-600">Per page</label>}
              <select value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)) }} className="border rounded px-2 py-1">
                {[10,20,30,40,50].map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
              {!isMobile && <div className="text-sm text-gray-600">Page</div>}
              <div className="inline-flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p-1))} className="flex items-center" icon={<ChevronLeft className="h-4 w-4"/>}>{!isMobile && <span className="ml-1">Prev</span>}</Button>
                <div className="px-2 py-1">{page} / {totalPages}</div>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p+1))} className="flex items-center" icon={<ChevronRight className="h-4 w-4"/>}>{!isMobile && <span className="mr-1">Next</span>}</Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto space-y-4">
            {filtered.length === 0 ? (
              <NoDataView title="No transactions" message="No transactions match your filters." iconType="transactions" />
            ) : filtered.map((t) => {
              const st = getTxStatus(t)
              // If a transaction is marked completed/success and has no failure_code,
              // force any percentage fragments in the description to show 100%.
              const formatDescription = (tx: Transaction, status: TransactionStatus) => {
                const raw = (tx.description || tx.event_type || 'Payment').toString()
                // If there's an explicit failure_code or failure_message that
                // indicates an error, don't force-percent to 100%.
                if (tx.failure_code) return raw
                const failureMsg = (tx.failure_message || '').toString().toLowerCase()
                if (failureMsg.includes('fail') || failureMsg.includes('error') || failureMsg.includes('declin')) return raw

                const rawLower = raw.toString().toLowerCase()
                const etLower = (tx.event_type || '').toString().toLowerCase()
                // Consider a transaction completed if its status is 'completed', the
                // normalized status is 'success', or the description/event_type
                // explicitly includes the word 'completed' (some backends flip the
                // description to "Completed" before updating the status field).
                const isCompleted = (tx.status || '').toString().toLowerCase() === 'completed'
                  || status === 'success'
                  || rawLower.includes('completed')
                  || etLower.includes('completed')
                if (!isCompleted) return raw

                // Replace percent-like fragments (e.g. '90%', '90 %', '90.5%', '90 percent')
                // with '100%'. Use a case-insensitive match for the word 'percent'.
                return raw.replace(/(\d{1,3}(?:\.\d+)?)\s*(?:%|percent\b)/gi, '100%')
              }

              const badge = t.failure_code ? failureBadge(t.failure_code, t.failure_message) : statusBadge(st)
              // console.log('Rendering transaction', t.id, 'status', st, 'badge', badge)

              return (
                <div key={t.id} className="p-4 border rounded bg-white">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-end sm:justify-between gap-4">
                        <TransactionCard
                          description={formatDescription(t, st)}
                          date={t.timestamp ? new Date(t.timestamp).toLocaleString() : undefined}
                          labels={(
                            (() => {
                              let labelColor = 'text-gray-600'
                              if (t.failure_code) labelColor = 'text-red-600'
                              else if (st === 'insufficient_funds') labelColor = 'text-yellow-600'
                              else if (st === 'failed') labelColor = 'text-red-600'
                              return (
                                <div className={`text-xs inline-flex text-xs leading-4 align-middle ${labelColor}`}>
                                  {t.user_email ? (
                                    <span className={`px-2 py-1 border ${t.failure_code ? 'bg-red-50 text-red-700 border-red-200' : st === 'insufficient_funds' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-700 border-gray-200'} rounded-l-sm truncate max-w-xs`}>
                                      {t.user_email}
                                    </span>
                                  ) : null}
                                  {t.session_id ? (
                                    <span className={`px-2 py-1 border border-l-0 ${t.failure_code ? 'bg-red-50 text-red-700 border-red-200' : st === 'insufficient_funds' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-700 border-gray-200'} rounded-r-sm truncate max-w-[20ch]`}>{t.session_id}</span>
                                  ) : null}
                                </div>
                              )
                            })()
                          )}
                          badge={t.failure_code ? failureBadge(t.failure_code, t.failure_message) : statusBadge(st)}
                          // credits={t.credits ?? null}
                          // amountUsd={t.amount_usd ?? null}
                        />
                      </div>
                    </div>
                    <div className="w-full flex flex-row items-center justify-end gap-3 text-right sm:flex-col sm:items-end sm:justify-start">
                      {(badge) ? <div className="flex-shrink-0 ml-2">{t.failure_code ? failureBadge(t.failure_code, t.failure_message) : statusBadge(st)}</div> : null}
                      <div className="font-semibold">{t.credits ?? 0} credits</div>
                      <div className="text-sm">
                        {(() => {
                          const et = (t.event_type || '').toString().toLowerCase()
                          const amt = typeof t.amount_usd === 'number' ? t.amount_usd : 0
                          const credits = typeof t.credits === 'number' ? t.credits : 0
                          if (credits === 0 && (!amt || amt === 0)) {
                            return <span className="text-yellow-600 font-medium">${Math.abs(amt).toFixed(2)}</span>
                          }
                          const positiveEvents = ['manual_credit', 'checkout_session_completed', 'credit', 'subscription', 'subscription_update', 'tier_update']
                          const isPositive = positiveEvents.some((p) => et.includes(p)) || amt > 0 || credits > 0
                          const negativeEvents = ['charge', 'analysis', 'charge_ingest', 'charge_report', 'ingest', 'report']
                          const isNegative = negativeEvents.some((n) => et.includes(n)) || amt < 0 || credits < 0
                          if (isNegative && !isPositive) {
                            return <span className="text-red-600 font-medium">−${Math.abs(amt).toFixed(2)}</span>
                          }
                          return <span className="text-green-600 font-medium">+${Math.abs(amt).toFixed(2)}</span>
                        })()}
                      </div>
                      {t.session_id && (
                        <div className="mt-0 sm:mt-2 ml-2 sm:ml-0">
                          <button className="text-sm text-blue-600 underline" onClick={async () => {
                            try {
                              const sid = t.session_id
                              if (!sid) {
                                paymentResult.show('failed', 'Check Failed', 'Missing session id')
                                return
                              }
                              const resp = await transactionsService.getTransaction(sid)
                              const tx = resp.transaction
                              paymentResult.show('pending', 'Transaction Status', `Pending transaction: ${tx.event_type} - ${tx.amount_usd ?? 0}$`)
                              await fetchTx()
                              try {
                                const updated = await transactionsService.getTransaction(sid)
                                const status = (updated.transaction as Transaction | undefined)?.status
                                if (status && status !== 'pending') {
                                  try {
                                    store.dispatch(clearPendingCheckout())
                                  } catch (e) {
                                    console.warn('Failed to clear pending_checkout via store', e)
                                  }
                                }
                              } catch (e) {
                                console.warn('Failed to refresh transaction status', e)
                              }
                              try { await refreshUser() } catch { /* ignore errors */ }
                            } catch (err: unknown) {
                              const msg = err instanceof Error ? err.message : String(err)
                              paymentResult.show('failed', 'Check Failed', msg)
                            }
                          }}>Check status</button>
                        </div>
                      )}
                    </div>
                  </div>
                  {t.failure_code ? (
                    <div className="mt-2">
                      {failureBadge(t.failure_code, t.failure_message)}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  )
}
