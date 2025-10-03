import api from '@/services/api'

export type Transaction = {
  id: string
  user_email?: string
  event_type?: string
  amount_usd?: number
  credits?: number
  description?: string
  timestamp?: string
}

const listTransactions = async (): Promise<{transactions: Transaction[]; balance: number}> => {
  const res = await api.get<{transactions: Transaction[]; balance: number}>('/api/v1/transactions')
  return res as {transactions: Transaction[]; balance: number}
}

export default { listTransactions }
