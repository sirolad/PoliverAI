import apiService from './api';

export type Transaction = {
  id: string;
  user_email?: string;
  event_type?: string;
  amount_usd?: number;
  credits?: number;
  description?: string;
  session_id?: string;
  timestamp?: string;
  failure_code?: string | null;
  failure_message?: string | null;
  status?: string;
};

type TxListResp = {
  transactions: Transaction[];
  balance: number;
  total?: number;
  total_pages?: number;
  page?: number;
  limit?: number;
  total_spent_credits?: number;
};

const listTransactions = async (opts?: { page?: number; limit?: number; date_from?: string | null; date_to?: string | null }): Promise<TxListResp> => {
  const url = '/api/v1/transactions';
  const qs = new URLSearchParams();
  if (opts?.page) qs.set('page', String(opts.page));
  if (opts?.limit) qs.set('limit', String(opts.limit));
  if (opts?.date_from) qs.set('date_from', opts.date_from);
  if (opts?.date_to) qs.set('date_to', opts.date_to);
  const finalUrl = qs.toString() ? `${url}?${qs.toString()}` : url;
  const res = await apiService.get<TxListResp>(finalUrl);
  return res as TxListResp;
};

const getTransaction = async (session_or_id: string): Promise<{transaction: Transaction}> => {
  const res = await apiService.get<{transaction: Transaction}>(`/api/v1/transactions/${encodeURIComponent(session_or_id)}`);
  return res as {transaction: Transaction};
};

export default { listTransactions, getTransaction };
