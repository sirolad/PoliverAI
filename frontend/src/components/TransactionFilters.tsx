import type { FC } from 'react'
import type { TransactionStatus, StatusFilter } from '@/types/transaction'
import { X, RefreshCcw } from 'lucide-react'
import { t } from '@/i18n'
import StatusFilterItem from '@/components/ui/StatusFilterItem'
import { Button } from '@/components/ui/Button'
import LoadingProgress from '@/components/LoadingProgress'

type Props = {
  search: string
  setSearch: (s: string) => void
  dateFrom: string | null
  setDateFrom: (d: string | null) => void
  dateTo: string | null
  setDateTo: (d: string | null) => void
  statusFilter: StatusFilter
  setStatusFilter: (s: StatusFilter | ((prev: StatusFilter) => StatusFilter)) => void
  progress: number
  showBar: boolean
  onClear: () => void
  onRefresh: () => void
}

const TransactionFilters: FC<Props> = ({ search, setSearch, dateFrom, setDateFrom, dateTo, setDateTo, statusFilter, setStatusFilter, progress, showBar, onClear, onRefresh }) => {
  return (
    <aside className="w-64 p-4 border rounded bg-white">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">{t('credits.search_label')}</label>
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border px-2 py-1 rounded" placeholder={t('credits.search_placeholder')} />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">{t('credits.date_from')}</label>
        <input type="date" value={dateFrom ?? ''} onChange={(e) => setDateFrom(e.target.value || null)} className="w-full border px-2 py-1 rounded" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">{t('credits.date_to')}</label>
        <input type="date" value={dateTo ?? ''} onChange={(e) => setDateTo(e.target.value || null)} className="w-full border px-2 py-1 rounded" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">{t('credits.status_label')}</label>
        {(Object.keys(statusFilter) as TransactionStatus[]).map((key) => {
          return (
            <div key={key} className="mb-1">
              <StatusFilterItem name={key} checked={!!statusFilter[key]} onChange={(n) => setStatusFilter((s) => ({ ...s, [n]: !s[n] }))} />
            </div>
          )
        })}
      </div>
      <div>
        <Button className="w-full bg-gray-100 text-black px-3 py-1 rounded" onClick={() => { onClear?.() }} icon={<X className="h-4 w-4" />} collapseToIcon>
          {t('credits.clear')}
        </Button>
      </div>
      <div className="mt-2">
        <Button className="w-full bg-green-600 text-white px-3 py-1 rounded" onClick={() => { onRefresh?.() }} icon={<RefreshCcw className="h-4 w-4" />} collapseToIcon>
          {t('credits.refresh')}
        </Button>
      </div>

      <LoadingProgress progress={progress} show={showBar} />
    </aside>
  )
}

export default TransactionFilters
