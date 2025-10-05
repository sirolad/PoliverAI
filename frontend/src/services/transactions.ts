import api from '@/services/api'

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
  let url = '/api/v1/transactions'
  const qs: string[] = []
  if (opts?.page && opts?.limit) qs.push(`page=${opts.page}`, `limit=${opts.limit}`)
  if (opts?.date_from) qs.push(`date_from=${encodeURIComponent(opts.date_from)}`)
  if (opts?.date_to) qs.push(`date_to=${encodeURIComponent(opts.date_to)}`)
  if (qs.length) url += `?${qs.join('&')}`
  const res = await api.get<TxListResp>(url)
  try {
    // emit a debug log so callers can inspect the raw payload shape in browser console
    console.debug('[transactions] listTransactions response', { url, payload: res })
  } catch {
    // swallow logging errors
  }
  return res as TxListResp
}

const getTransaction = async (session_or_id: string): Promise<{transaction: Transaction}> => {
  const res = await api.get<{transaction: Transaction}>(`/api/v1/transactions/${encodeURIComponent(session_or_id)}`)
  return res as {transaction: Transaction}
}

export default { listTransactions, getTransaction }
