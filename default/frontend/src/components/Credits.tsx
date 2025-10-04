import { useEffect, useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '@/contexts/useAuth'
import transactionsService from '@/services/transactions'
import PaymentsService from '@/services/payments'
import EnterCreditsModal from '@/components/ui/EnterCreditsModal'
import usePaymentResult from '@/components/ui/PaymentResultHook'
import type { Transaction } from '@/services/transactions'

export default function Credits() {
  const { user, isAuthenticated, loading, refreshUser } = useAuth()
  const [items, setItems] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState<string | null>(null)
  const [dateTo, setDateTo] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({ pending: true, success: true, failed: true, processing: true, insufficient_funds: true, unknown: true })
  const paymentResult = usePaymentResult()

  useEffect(() => { fetchTx() }, [])

  const fetchTx = async () => {
    setIsLoading(true)
    try {
      const r = await transactionsService.listTransactions()
      setItems(r.transactions || [])
    } catch (e) {
      console.error('Failed to load transactions', e)
      setError('Failed to load transactions')
    } finally {
      setIsLoading(false)
    }
  }
  const getTxStatus = (t: Transaction) => {
    const s = (t as unknown as Record<string, unknown>)['status'] as string | undefined
    const et = (t.event_type || '').toString().toLowerCase()
    const desc = (t.description || '').toString().toLowerCase()
    if (s === 'pending' || et.includes('pending')) return 'pending'
    if (s === 'completed' || et.includes('completed') || (t.credits && t.credits > 0)) return 'success'
    if (et.includes('failed') || desc.includes('failed') || desc.includes('declined') || desc.includes('payment_failed')) return 'failed'
    if (desc.includes('insufficient') || desc.includes('insufficient_funds') || desc.includes('insufficient_fund')) return 'insufficient_funds'
    if (et.includes('processing') || desc.includes('processing')) return 'processing'
    return 'unknown'
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-block text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">Pending</span>
      case 'success':
        return <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Success</span>
      case 'failed':
        return <span className="inline-block text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">Failed</span>
      case 'insufficient_funds':
        return <span className="inline-block text-xs px-2 py-1 rounded-full bg-red-50 text-red-700">Insufficient Funds</span>
      case 'processing':
        return <span className="inline-block text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">Processing</span>
      default:
        return <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">Unknown</span>
    }
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
    <div className="h-screen p-8 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Purchased Credits</h1>

        <div className="mb-4 flex items-center gap-4">
          <div>Balance: <span className="font-semibold">{user?.credits ?? 0} credits</span></div>
        </div>
      </div>
      <EnterCreditsModal
        open={showModal}
        onClose={() => setShowModal(false)}
            onConfirm={async (amount_usd: number) => {
          try {
            await PaymentsService.purchaseCredits(amount_usd)
            paymentResult.show(true, 'Purchase Successful', `Added ${(amount_usd * 10).toFixed(0)} credits`)
            // Refresh transactions and user
            await fetchTx()
                // refresh current user so balance updates
                try { await refreshUser() } catch (e) { console.error('Failed to refresh user after credit purchase', e) }
                // short delay to let credits update
                setTimeout(() => {}, 500)
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err)
            paymentResult.show(false, 'Purchase Failed', msg)
          }
        }}
      />
      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="flex-1 flex gap-6">
        {/* Sidebar filters */}
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
            <label className="block text-sm font-medium mb-2">Status</label>
            {Object.keys(statusFilter).map((k) => (
              <div key={k} className="flex items-center gap-2 mb-1">
                <input type="checkbox" checked={statusFilter[k]} onChange={() => setStatusFilter((s) => ({ ...s, [k]: !s[k] }))} />
                <label className="text-sm capitalize">{k.replace('_', ' ')}</label>
              </div>
            ))}
          </div>
          <div>
            <button className="w-full bg-gray-100 px-3 py-1 rounded" onClick={() => { setSearch(''); setDateFrom(null); setDateTo(null); setStatusFilter({ pending: true, success: true, failed: true, processing: true, insufficient_funds: true, unknown: true }) }}>Clear</button>
          </div>
        </aside>

        {/* List area */}
        <div className="flex-1 flex flex-col">
          <div className="mb-2">
            <div className="text-sm text-gray-600">Showing {filtered.length} of {items.length} transactions</div>
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
                        <div>{statusBadge(st)}</div>
                      </div>
                      <div className="text-sm text-gray-600">{t.user_email ?? ''} • {t.session_id ?? ''}</div>
                      <div className="text-sm text-gray-600">{t.timestamp ? new Date(t.timestamp).toLocaleString() : '-'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{t.credits ?? 0} credits</div>
                      <div className="text-sm text-gray-500">${t.amount_usd?.toFixed(2) ?? '0.00'}</div>
                      {t.session_id && (
                        <div className="mt-2">
                          <button
                            className="text-sm text-blue-600 underline"
                            onClick={async () => {
                              try {
                                const sid = t.session_id
                                if (!sid) {
                                  paymentResult.show(false, 'Check Failed', 'Missing session id')
                                  return
                                }
                                const resp = await transactionsService.getTransaction(sid)
                                const tx = resp.transaction
                                paymentResult.show(true, 'Transaction Status', `Found transaction: ${tx.event_type} - ${tx.amount_usd ?? 0}$`)
                                // refresh list to pick up any changes
                                await fetchTx()
                                // refresh current user so balance updates
                                try { await refreshUser() } catch { /* ignore errors */ }
                              } catch (err: unknown) {
                                const msg = err instanceof Error ? err.message : String(err)
                                paymentResult.show(false, 'Check Failed', msg)
                              }
                            }}
                          >
                            Check status
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
