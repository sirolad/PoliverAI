import { useEffect, useState, useMemo, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '@/contexts/useAuth'
import transactionsService from '@/services/transactions'
import PaymentsService from '@/services/payments'
import EnterCreditsModal from '@/components/ui/EnterCreditsModal'
import usePaymentResult from '@/components/ui/PaymentResultHook'
import type { Transaction } from '@/services/transactions'
import { X, ChevronLeft, ChevronRight, RefreshCcw, Shield, CreditCard, DollarSign, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function Credits() {
  const { user, isAuthenticated, loading, refreshUser } = useAuth()
  const [items, setItems] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({ pending: true, success: true, failed: true, processing: true, insufficient_funds: true, unknown: true, task: true })
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
  const getTxStatus = (t: Transaction) => {
    const s = (t as unknown as Record<string, unknown>)['status'] as string | undefined
    const et = (t.event_type || '').toString().toLowerCase()
    const desc = (t.description || '').toString().toLowerCase()
    if (s === 'pending' || et.includes('pending')) return 'pending'
  if (s === 'completed' || et.includes('completed') || (typeof t.credits === 'number' && t.credits !== 0)) return 'success'
    if (et.includes('failed') || desc.includes('failed') || desc.includes('declined') || desc.includes('payment_failed')) return 'failed'
    if (desc.includes('insufficient') || desc.includes('insufficient_funds') || desc.includes('insufficient_fund')) return 'insufficient_funds'
    if (et.includes('processing') || desc.includes('processing')) return 'processing'
    return 'task'
  }

  const statusBadge = (status: string) => {
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
        {failure_message ? <div className="text-xs text-gray-500 mt-1">{failure_message}</div> : null}
      </div>
    )
  }

  const filtered = useMemo(() => {
    const sfKeys = Object.keys(statusFilter).filter((k) => statusFilter[k])
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
            const spentCredits = totalSpentCredits ?? 0
            return (
              <div className="flex items-center gap-4">
                <div className={`bg-white rounded shadow text-sm flex items-center gap-3 ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                  <div className={`flex-shrink-0 bg-blue-50 rounded-md flex items-center justify-center ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                    <Shield className={`${isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10'} text-blue-600`} />
                  </div>
                  <div>
                    <div className="text-gray-600">Subscription</div>
                    <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{subscriptionCredits} credits</div>
                  </div>
                </div>
                <div className={`bg-white rounded shadow text-sm flex items-center gap-3 ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                  <div className={`flex-shrink-0 bg-gray-50 rounded-md flex items-center justify-center ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                    <CreditCard className={`${isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10'} text-gray-700`} />
                  </div>
                  <div>
                    <div className="text-gray-600">Purchased</div>
                    <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{purchasedCredits} credits</div>
                  </div>
                </div>
                <div className={`bg-white rounded shadow text-sm flex items-center gap-3 ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                  <div className={`flex-shrink-0 bg-red-50 rounded-md flex items-center justify-center ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                    <DollarSign className={`${isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10'} text-red-600`} />
                  </div>
                  <div>
                    <div className="text-gray-600">Total Spent</div>
                    <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{spentCredits} credits</div>
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

            return (
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className={`bg-white rounded shadow text-sm flex items-center gap-4 ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                  <div className={`flex-shrink-0 bg-blue-50 rounded-md flex items-center justify-center ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                    <Shield className={`${isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10'} text-blue-600`} />
                  </div>
                  <div>
                    <div className="text-gray-600">Subscription Credits</div>
                    <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{subscriptionCredits} credits</div>
                    {!isCompactUnderHeader && <div className="text-xs text-gray-500">${subscriptionUsd.toFixed(2)} USD equivalent</div>}
                  </div>
                </div>

                <div className={`bg-white rounded shadow text-sm flex items-center gap-4 ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                  <div className={`flex-shrink-0 bg-gray-50 rounded-md flex items-center justify-center ${isCompactUnderHeader ? 'p-2' : 'p-3'}`}>
                    <CreditCard className={`${isCompactUnderHeader ? 'h-8 w-8' : 'h-10 w-10'} text-gray-700`} />
                  </div>
                  <div>
                    <div className="text-gray-600">Purchased Credits</div>
                    <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{purchasedCredits} credits</div>
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
                    <div className={`${isCompactUnderHeader ? 'font-semibold' : 'font-semibold text-lg'}`}>{spentCredits} credits</div>
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
      {isLoading && <div>Loading...</div>}
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
                {Object.keys(statusFilter).map((k) => (
                  <div key={k} className="flex items-center gap-2 mb-1">
                    <input type="checkbox" checked={statusFilter[k]} onChange={() => setStatusFilter((s) => ({ ...s, [k]: !s[k] }))} />
                    <label className="text-sm capitalize">{k.replace('_', ' ')}</label>
                  </div>
                ))}
              </div>
              <div>
                <Button className="w-full bg-gray-100 text-black px-3 py-1 rounded" onClick={() => { setSearch(''); setDateFrom(null); setDateTo(null); setStatusFilter({ pending: true, success: true, failed: true, processing: true, insufficient_funds: true, unknown: true, task: true }) }} icon={<X className="h-4 w-4" />} collapseToIcon>
                  Clear
                </Button>
              </div>
              <div className="mt-2">
                <Button className="w-full bg-white border text-black px-3 py-1 rounded" onClick={async () => { try { await fetchTx(); try { await refreshUser() } catch { /* ignore */ } } catch (e) { console.error('refresh failed', e) } }} icon={<RefreshCcw className="h-4 w-4" />} collapseToIcon>
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
              {Object.keys(statusFilter).map((k) => (
                <div key={k} className="flex items-center gap-2 mb-1">
                  <input type="checkbox" checked={statusFilter[k]} onChange={() => setStatusFilter((s) => ({ ...s, [k]: !s[k] }))} />
                  <label className="text-sm capitalize">{k.replace('_', ' ')}</label>
                </div>
              ))}
            </div>
            <div>
              <Button className="w-full bg-gray-100 text-black px-3 py-1 rounded" onClick={() => { setSearch(''); setDateFrom(null); setDateTo(null); setStatusFilter({ pending: true, success: true, failed: true, processing: true, insufficient_funds: true, unknown: true, task: true }) }} icon={<X className="h-4 w-4" />} collapseToIcon>
                Clear
              </Button>
            </div>
            <div className="mt-2">
              <Button className="w-full bg-white border text-black px-3 py-1 rounded" onClick={async () => { try { await fetchTx(); try { await refreshUser() } catch { /* ignore */ } } catch (e) { console.error('refresh failed', e) } }} icon={<RefreshCcw className="h-4 w-4" />} collapseToIcon>
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
            <div className="mb-2 flex items-center justify-between">
            <div className="text-sm text-gray-600">Showing {filtered.length} of {total ?? items.length} transactions</div>
            <div className="flex items-center gap-3">
              {!isMobile && <label className="text-sm text-gray-600">Per page</label>}
              <select value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)) }} className="border rounded px-2 py-1">
                {[10,20,30,40,50].map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
              {!isMobile && <div className="text-sm text-gray-600">Page</div>}
              <div className="inline-flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p-1))} className="px-2 py-1 border rounded flex items-center"><ChevronLeft className="h-4 w-4"/>{!isMobile && <span className="ml-1">Prev</span>}</button>
                <div className="px-2 py-1">{page} / {totalPages}</div>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p+1))} className="px-2 py-1 border rounded flex items-center">{!isMobile && <span className="mr-1">Next</span>}<ChevronRight className="h-4 w-4"/></button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto space-y-4">
            {filtered.map((t) => {
              const st = getTxStatus(t)
              return (
                <div key={t.id} className="p-4 border rounded bg-white">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-medium">{t.description || t.event_type || 'Payment'}</div>
                        <div>{t.failure_code ? statusBadge(t.failure_code) : statusBadge(st)}</div>
                      </div>
                      <div className="text-sm text-gray-600">{t.user_email ?? ''} • {t.session_id ?? ''}</div>
                      <div className="text-sm text-gray-600">{t.timestamp ? new Date(t.timestamp).toLocaleString() : '-'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{t.credits ?? 0} credits</div>
                        <div className="text-sm">
                          {(() => {
                            const et = (t.event_type || '').toString().toLowerCase()
                            const amt = typeof t.amount_usd === 'number' ? t.amount_usd : 0
                            const credits = typeof t.credits === 'number' ? t.credits : 0
                            // Zero-usage (no credits, no USD) -> yellow
                            if (credits === 0 && (!amt || amt === 0)) {
                              return <span className="text-yellow-600 font-medium">${Math.abs(amt).toFixed(2)}</span>
                            }
                            // Positive events (purchases, credit top-ups, subscriptions)
                            const positiveEvents = ['manual_credit', 'checkout_session_completed', 'credit', 'subscription', 'subscription_update', 'tier_update']
                            const isPositive = positiveEvents.some((p) => et.includes(p)) || amt > 0 || credits > 0
                            // Charge/operation events (analysis/report/ingest/charge) are negative
                            const negativeEvents = ['charge', 'analysis', 'charge_ingest', 'charge_report', 'ingest', 'report']
                            const isNegative = negativeEvents.some((n) => et.includes(n)) || amt < 0 || credits < 0

                            if (isNegative && !isPositive) {
                              return <span className="text-red-600 font-medium">−${Math.abs(amt).toFixed(2)}</span>
                            }

                            // Default to positive display
                            return <span className="text-green-600 font-medium">+${Math.abs(amt).toFixed(2)}</span>
                          })()}
                        </div>
                      {t.session_id && (
                        <div className="mt-2">
                          <button
                            className="text-sm text-blue-600 underline"
                            onClick={async () => {
                              try {
                                const sid = t.session_id
                                if (!sid) {
                                  paymentResult.show('failed', 'Check Failed', 'Missing session id')
                                  return
                                }
                                const resp = await transactionsService.getTransaction(sid)
                                const tx = resp.transaction
                                paymentResult.show('pending', 'Transaction Status', `Pending transaction: ${tx.event_type} - ${tx.amount_usd ?? 0}$`)
                                // refresh list to pick up any changes
                                await fetchTx()
                                // if transaction finalized, clear any cached pending_checkout to avoid repeated checks
                                try {
                                  const updated = await transactionsService.getTransaction(sid)
                                  const status = (updated.transaction as Transaction | undefined)?.status
                                  if (status && status !== 'pending') {
                                    if (typeof window !== 'undefined' && window.localStorage) {
                                      try {
                                        localStorage.removeItem('poliverai:pending_checkout')
                                      } catch (e) {
                                        console.warn('Failed to remove pending_checkout from localStorage', e)
                                      }
                                    }
                                  }
                                } catch (e) {
                                  console.warn('Failed to refresh transaction status', e)
                                }
                                // refresh current user so balance updates
                                try { await refreshUser() } catch { /* ignore errors */ }
                              } catch (err: unknown) {
                                const msg = err instanceof Error ? err.message : String(err)
                                paymentResult.show('failed', 'Check Failed', msg)
                              }
                            }}
                          >
                            Check status
                          </button>
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
        </div>
      </div>
    </div>
  )
}
