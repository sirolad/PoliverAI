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
}

const listTransactions = async (): Promise<{transactions: Transaction[]; balance: number}> => {
  const res = await api.get<{transactions: Transaction[]; balance: number}>('/api/v1/transactions')
  return res as {transactions: Transaction[]; balance: number}
}

const getTransaction = async (session_or_id: string): Promise<{transaction: Transaction}> => {
  const res = await api.get<{transaction: Transaction}>(`/api/v1/transactions/${encodeURIComponent(session_or_id)}`)
  return res as {transaction: Transaction}
}

export default { listTransactions, getTransaction }
