export type TransactionStatus = 'pending' | 'success' | 'failed' | 'processing' | 'insufficient_funds' | 'unknown' | 'task'

export type StatusFilter = Record<TransactionStatus, boolean>
