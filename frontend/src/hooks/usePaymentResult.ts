import { useEffect } from 'react'
import { store } from '@/store/store'
import { clearPaymentResult } from '@/store/paymentsSlice'
import { normalizePaymentResult } from '@/lib/paymentsHelpers'

type ShowResultFn = (status: string | boolean, title: string, message?: string) => void

// Hook: listen for global payment events and re-check persisted payment result
export default function usePaymentResult(showResult: ShowResultFn, refreshUser: () => Promise<void>) {
  useEffect(() => {
    const eventHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail) {
        // refresh user and show modal via provided callback
        void (async () => { try { await refreshUser() } catch (err) { console.warn('refreshUser failed', err) } })()
        showResult(detail.status || (detail.success ? 'success' : 'failed'), detail.title, detail.message)
      }
    }

    const checkPersisted = () => {
      try {
        const state = store.getState()
        const pr = state?.payments?.paymentResult
        if (pr) {
          void (async () => { try { await refreshUser() } catch (err) { console.warn('refreshUser failed', err) } })()
          const normalized = normalizePaymentResult(pr)
          showResult(normalized.status || 'failed', normalized.title, normalized.message)
          try { store.dispatch(clearPaymentResult()) } catch { /* noop */ }
        }
      } catch (err) {
        console.warn('Failed to read persisted payment_result from store', err)
      }
    }

    window.addEventListener('payment:result', eventHandler as EventListener)
    window.addEventListener('focus', checkPersisted)

    // Run once on mount
    checkPersisted()

    return () => {
      window.removeEventListener('payment:result', eventHandler as EventListener)
      window.removeEventListener('focus', checkPersisted)
    }
  }, [refreshUser, showResult])
}
