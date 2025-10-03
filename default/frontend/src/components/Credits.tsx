import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '@/contexts/useAuth'
import transactionsService from '@/services/transactions'
import PaymentsService from '@/services/payments'
import EnterCreditsModal from '@/components/ui/EnterCreditsModal'
import usePaymentResult from '@/components/ui/PaymentResultHook'
import type { Transaction } from '@/services/transactions'

export default function Credits() {
  const { user, isAuthenticated, loading } = useAuth()
  const [items, setItems] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen p-8">
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
      <div className="space-y-4">
        {items.map((t) => (
          <div key={t.id} className="p-4 border rounded">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{t.description || t.event_type || 'Payment'}</div>
                <div className="text-sm text-gray-600">{new Date(t.timestamp || '').toLocaleString()}</div>
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
        ))}
      </div>
    </div>
  )
}
