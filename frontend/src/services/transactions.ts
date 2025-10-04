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

const listTransactions = async (opts?: { page?: number; limit?: number }): Promise<TxListResp> => {
  let url = '/api/v1/transactions'
  if (opts?.page && opts?.limit) {
    url += `?page=${opts.page}&limit=${opts.limit}`
  }
  const res = await api.get<TxListResp>(url)
  return res as TxListResp
}

const getTransaction = async (session_or_id: string): Promise<{transaction: Transaction}> => {
  const res = await api.get<{transaction: Transaction}>(`/api/v1/transactions/${encodeURIComponent(session_or_id)}`)
  return res as {transaction: Transaction}
}

export default { listTransactions, getTransaction }
