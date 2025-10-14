import api from './api'
import { buildUrl } from '../lib/urlHelpers'
import { safeDebug } from '../lib/logHelpers'

export type Transaction = {
  id: string
  user_email?: string
  event_type?: string
  amount_usd?: number
  credits?: number
  description?: string
  session_id?: string
  timestamp?: string
  failure_code?: string | null
  failure_message?: string | null
  status?: string
}

type TxListResp = {
  transactions: Transaction[]
  balance: number
  total?: number
  total_pages?: number
  page?: number
  limit?: number
  total_spent_credits?: number
}

const listTransactions = async (opts?: { page?: number; limit?: number; date_from?: string | null; date_to?: string | null }): Promise<TxListResp> => {
  const url = buildUrl('/api/v1/transactions', {
    page: opts?.page,
    limit: opts?.limit,
    date_from: opts?.date_from ?? undefined,
    date_to: opts?.date_to ?? undefined,
  })
  const res = await api.get<TxListResp>(url)
  safeDebug('[transactions] listTransactions response', { url, payload: res })
  return res as TxListResp
}

const getTransaction = async (session_or_id: string): Promise<{transaction: Transaction}> => {
  const res = await api.get<{transaction: Transaction}>(`/api/v1/transactions/${encodeURIComponent(session_or_id)}`)
  return res as {transaction: Transaction}
}

export default { listTransactions, getTransaction }
