import type { FC } from 'react'
import type { TransactionStatus, StatusFilter } from '@/types/transaction'
import { X, RefreshCcw } from 'lucide-react'
import { t } from '@/i18n'
import StatusFilterItem from '@/components/ui/StatusFilterItem'
import { Button } from '@/components/ui/Button'
import LoadingProgress from '@/components/LoadingProgress'
import { textSizes, twFromTokens, spacing, colors, fontWeights, alignment } from '@/styles/styleTokens'

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
    <aside className={twFromTokens(spacing.fullWidth, 'w-64', spacing.card, 'border', 'rounded', colors.surface, alignment.flexCol)}>
      <div className={twFromTokens(spacing.formRow)}>
        <label className={twFromTokens(textSizes.sm, fontWeights.medium, spacing.formLabel)}>{t('credits.search_label')}</label>
        <input value={search} onChange={(e) => setSearch(e.target.value)} className={twFromTokens(spacing.input, colors.mutedBorder)} placeholder={t('credits.search_placeholder')} />
      </div>
      <div className={twFromTokens(spacing.formRow)}>
        <label className={twFromTokens(textSizes.sm, fontWeights.medium, spacing.formLabel)}>{t('credits.date_from')}</label>
        <input type="date" value={dateFrom ?? ''} onChange={(e) => setDateFrom(e.target.value || null)} className={twFromTokens(spacing.input, colors.mutedBorder)} />
      </div>
      <div className={twFromTokens(spacing.formRow)}>
        <label className={twFromTokens(textSizes.sm, fontWeights.medium, spacing.formLabel)}>{t('credits.date_to')}</label>
        <input type="date" value={dateTo ?? ''} onChange={(e) => setDateTo(e.target.value || null)} className={twFromTokens(spacing.input, colors.mutedBorder)} />
      </div>
      <div className={twFromTokens(spacing.formRow)}>
        <label className={twFromTokens(textSizes.sm, fontWeights.medium, spacing.formLabel)}>{t('credits.status_label')}</label>
        {(Object.keys(statusFilter) as TransactionStatus[]).map((key) => {
          return (
            <div key={key} className={twFromTokens(spacing.formRowSmall)}>
              <StatusFilterItem name={key} checked={!!statusFilter[key]} onChange={(n) => setStatusFilter((s) => ({ ...s, [n]: !s[n] }))} />
            </div>
          )
        })}
      </div>
      <div className={twFromTokens(alignment.flexCol, spacing.smallTop)}>
        <Button className={twFromTokens(spacing.fullWidth, spacing.buttonSmall, colors.surfaceMuted, colors.textPrimary)} onClick={() => { onClear?.() }} icon={<X className={twFromTokens('h-4 w-4', colors.textMuted)} />} collapseToIcon>
          {t('credits.clear')}
        </Button>
        <div className={twFromTokens(spacing.smallTop)}>
          <Button className={twFromTokens(spacing.fullWidth, spacing.buttonSmall, colors.successBg, colors.onPrimary)} onClick={() => { onRefresh?.() }} icon={<RefreshCcw className={twFromTokens('h-4 w-4', colors.onPrimary)} />} collapseToIcon>
            {t('credits.refresh')}
          </Button>
        </div>
      </div>

      <LoadingProgress progress={progress} show={showBar} />
    </aside>
  )
}

export default TransactionFilters
