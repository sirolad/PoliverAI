import { useCallback } from 'react'
import type { StatusFilter } from '@/types/transaction'

export default function useTransactionFilters(
  setSearch: (s: string) => void,
  setDateFrom: (d: string | null) => void,
  setDateTo: (d: string | null) => void,
  setStatusFilter: (s: StatusFilter | ((prev: StatusFilter) => StatusFilter)) => void,
  fetchTx: () => Promise<void>,
  refreshUser?: () => Promise<void>
) {
  const clear = useCallback(() => {
    setSearch('')
    setDateFrom(null)
    setDateTo(null)
    setStatusFilter({ pending: true, success: true, failed: true, processing: true, insufficient_funds: true, unknown: true, task: true })
  }, [setSearch, setDateFrom, setDateTo, setStatusFilter])

  const refresh = useCallback(async () => {
    try {
      await fetchTx()
      if (refreshUser) {
        try { await refreshUser() } catch { /* ignore */ }
      }
    } catch (e) {
      console.error('refresh failed', e)
    }
  }, [fetchTx, refreshUser])

  return { clear, refresh }
}
