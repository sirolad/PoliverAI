import type { Transaction } from '@/services/transactions'
import type { TransactionStatus } from '@/types/transaction'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import NoDataView from '@/components/ui/NoDataView'
import TransactionListItem from '@/components/TransactionListItem'

type Props = {
  filtered: Transaction[]
  total?: number | null
  itemsLength: number
  page: number
  setPage: (n: number) => void
  limit: number
  setLimit: (n: number) => void
  totalPages: number
  isMobile: boolean
  fetchTx: () => Promise<void>
  refreshUser?: () => Promise<void>
  getTxStatus: (t: Transaction) => TransactionStatus
}

export default function TransactionList({ filtered, total, itemsLength, page, setPage, limit, setLimit, totalPages, isMobile, fetchTx, refreshUser, getTxStatus }: Props) {
  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm text-gray-600"><span className="hidden sm:inline">Showing </span>{filtered.length} of {total ?? itemsLength}<span className="hidden sm:inline"> transactions</span></div>
        <div className="flex items-center gap-3">
          {!isMobile && <label className="text-sm text-gray-600">Per page</label>}
          <select value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)) }} className="border rounded px-2 py-1">
            {[10,20,30,40,50].map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
          {!isMobile && <div className="text-sm text-gray-600">Page</div>}
          <div className="inline-flex items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(Math.max(1, page-1))} className="flex items-center" icon={<ChevronLeft className="h-4 w-4"/>}>{!isMobile && <span className="ml-1">Prev</span>}</Button>
            <div className="px-2 py-1">{page} / {totalPages}</div>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(Math.min(totalPages, page+1))} className="flex items-center" icon={<ChevronRight className="h-4 w-4"/>}>{!isMobile && <span className="mr-1">Next</span>}</Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto space-y-4">
        {filtered.length === 0 ? (
          <NoDataView title="No transactions" message="No transactions match your filters." iconType="transactions" />
        ) : filtered.map((t) => {
          const st = getTxStatus(t)
          return (
            <TransactionListItem key={t.id} tx={t} st={st} fetchTx={fetchTx} refreshUser={refreshUser} />
          )
        })}
      </div>
    </>
  )
}
