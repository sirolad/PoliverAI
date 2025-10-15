import type { Transaction } from '@/services/transactions'
import type { TransactionStatus } from '@/types/transaction'
import { Button } from '@/components/ui/Button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import NoDataView from '@/components/ui/NoDataView'
import TransactionListItem from '@/components/TransactionListItem'
import Text from './ui/Text'
import { textSizes, colors, twFromTokens, spacing, alignment } from '@/styles/styleTokens'

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
      <div className={twFromTokens(spacing.blockSmall, alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween)}>
        <div className={twFromTokens(textSizes.sm, colors.textMuted)}><span className={twFromTokens('hidden sm:inline')}>Showing </span>{filtered.length} of {total ?? itemsLength}<span className={twFromTokens('hidden sm:inline')}> transactions</span></div>
        <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, spacing.controlsGap)}>
          {!isMobile && <Text as="span" preset="small" color="textMuted">Per page</Text>}
          <select value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)) }} className={twFromTokens('border', colors.mutedBorder, 'rounded', spacing.buttonSmall.tw)}>
            {[10,20,30,40,50].map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
          {!isMobile && <Text as="span" preset="small" color="textMuted">Page</Text>}
          <div className={twFromTokens('inline-flex', alignment.itemsCenter, spacing.controlsGap)}>
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(Math.max(1, page-1))} className={twFromTokens(alignment.flexRow, alignment.itemsCenter)} icon={<ChevronLeft className={twFromTokens('h-4 w-4', colors.textMuted)} />}>{!isMobile && <span className="ml-1">Prev</span>}</Button>
            <div className={twFromTokens(spacing.buttonSmall, textSizes.sm)}>{page} / {totalPages}</div>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(Math.min(totalPages, page+1))} className={twFromTokens(alignment.flexRow, alignment.itemsCenter)} icon={<ChevronRight className={twFromTokens('h-4 w-4', colors.textMuted)} />}>{!isMobile && <span className="mr-1">Next</span>}</Button>
          </div>
        </div>
      </div>

      <div className={twFromTokens(spacing.listContainer)}>
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
