import { useEffect, useState, useMemo, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '@/contexts/useAuth'
import transactionsService from '@/services/transactions'
import PaymentsService from '@/services/payments'
import EnterCreditsModal from '@/components/ui/EnterCreditsModal'
import useRampedCounters from '@/hooks/useRampedCounters'
import useLoadingProgress from '@/hooks/useLoadingProgress'
import LoadingProgress from '@/components/LoadingProgress'
import usePaymentResult from '@/components/ui/PaymentResultHook'
import type { Transaction } from '@/services/transactions'
import type { TransactionStatus, StatusFilter } from '@/types/transaction'
import { Filter } from 'lucide-react'
import { t } from '@/i18n'
import { Button } from '@/components/ui/Button'
// ...existing code...
import TransactionList from '@/components/TransactionList'
import TransactionFilters from '@/components/TransactionFilters'
import useTransactionFilters from '@/hooks/useTransactionFilters'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import useCreditsSummary from '@/hooks/useCreditsSummary'
import CreditsSummary from '@/components/CreditsSummary'

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
  // progress animation for loading state is handled by a reusable hook
  const { progress, showBar } = useLoadingProgress(isLoading)
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

  // progress animation is delegated to useLoadingProgress

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
      setError(t('credits.failed_to_load_transactions'))
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
  // Prepare values for the credits summary hook/component. Call hook at top-level.
  const subscriptionCredits = user?.subscription_credits ?? 0
  const purchasedCredits = user?.credits ?? 0
  const { subscriptionUsd, purchasedUsd, spentUsd } = useCreditsSummary(subscriptionCredits, purchasedCredits, totalSpentCredits)
  const { clear, refresh } = useTransactionFilters(setSearch, setDateFrom, setDateTo, setStatusFilter, fetchTx, refreshUser)
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
  // status/failure badge rendering moved to TransactionListItem

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

  if (loading) return (<div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner message={t('credits.loading')} size="lg" />
        </div>)
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="p-8 flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">{t('credits.transaction_history_title')}</h1>

        <div className="flex items-center gap-3">
          {/* Show filters toggle on mobile */}
          {isMobile && (
            <Button size="sm" variant="outline" icon={<Filter className="h-4 w-4" />} onClick={() => setFiltersOpen((s) => !s)} collapseToIcon>
              {filtersOpen ? t('credits.hide_filters') : t('credits.show_filters')}
            </Button>
          )}

          {/* On wide screens (>1276) show a compact credits summary inline */}
          {isWide1276 && (
            <CreditsSummary
              isCompactUnderHeader={isCompactUnderHeader}
              statsLoaded={statsLoaded}
              animatedTop={animatedTop}
              subscriptionUsd={subscriptionUsd}
              purchasedUsd={purchasedUsd}
              spentUsd={spentUsd}
              total={subscriptionCredits + purchasedCredits}
            />
          )}
        </div>
      </div>

      {/* If not wide, render the full credits breakdown below the header */}
      {!isWide1276 && (
        <div className="mb-4">
          <CreditsSummary
            isCompactUnderHeader={isCompactUnderHeader}
            statsLoaded={statsLoaded}
            animatedTop={animatedTop}
            subscriptionUsd={subscriptionUsd}
            purchasedUsd={purchasedUsd}
            spentUsd={spentUsd}
            total={subscriptionCredits + purchasedCredits}
            mobileCompact={isMobile}
          />
        </div>
      )}
      {/* Mobile: show a compact progress bar here too so it's visible even when filters are hidden */}
      {isMobile && <LoadingProgress progress={progress} show={showBar} />}
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
            <TransactionFilters
              search={search}
              setSearch={setSearch}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onClear={clear}
              onRefresh={refresh}
              progress={progress}
              showBar={showBar}
            />
          ) : null
        ) : (
          <TransactionFilters
            search={search}
            setSearch={setSearch}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onClear={clear}
            onRefresh={refresh}
            progress={progress}
            showBar={showBar}
          />
        )}

        {/* List area */}
        <div className="flex-1 flex flex-col">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <LoadingSpinner message={t('credits.loading_transactions_title')} subtext={t('credits.loading_transactions_subtext')} size="lg" />
            </div>
          ) : (
            <>
              <TransactionList
                filtered={filtered}
                total={total}
                itemsLength={items.length}
                page={page}
                setPage={setPage}
                limit={limit}
                setLimit={setLimit}
                totalPages={totalPages}
                isMobile={isMobile}
                fetchTx={fetchTx}
                refreshUser={refreshUser}
                getTxStatus={getTxStatus}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
