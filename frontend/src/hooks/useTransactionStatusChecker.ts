import transactionsService, { type Transaction } from '@/services/transactions'
import { store } from '@/store/store'
import { clearPendingCheckout } from '@/store/paymentsSlice'

type PaymentResult = {
  show: (status: 'pending' | 'failed' | 'success', title: string, msg?: string) => void
}

export default function useTransactionStatusChecker() {
  async function checkTransaction(sessionId: string | undefined | null, paymentResult: PaymentResult, fetchTx: () => Promise<void>, refreshUser?: () => Promise<void>) {
    if (!sessionId) {
      paymentResult.show('failed', 'Check Failed', 'Missing session id')
      return
    }

    try {
      const resp = await transactionsService.getTransaction(sessionId)
      const tx = resp.transaction as Transaction | undefined
      paymentResult.show('pending', 'Transaction Status', `Pending transaction: ${tx?.event_type} - ${tx?.amount_usd ?? 0}$`)

      await fetchTx()

      try {
        const updated = await transactionsService.getTransaction(sessionId)
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

      if (refreshUser) {
        try { await refreshUser() } catch { /* ignore errors */ }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      paymentResult.show('failed', 'Check Failed', msg)
    }
  }

  return { checkTransaction }
}
