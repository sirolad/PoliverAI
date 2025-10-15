import { toIso } from '@/lib/dateHelpers'
import { Button } from '@/components/ui/Button'
import { t } from '@/i18n'
import { twFromTokens, textSizes, colors, fontWeights, spacing, alignment } from '@/styles/styleTokens'

type FiltersProps = {
  query: string
  setQuery: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  verdictOptions: string[]
  startDate: string
  endDate: string
  setStartDate: (v: string) => void
  setEndDate: (v: string) => void
  clearAll: () => void
  isLoading?: boolean
}

export default function Filters({ query, setQuery, statusFilter, setStatusFilter, verdictOptions, startDate, endDate, setStartDate, setEndDate, clearAll, isLoading = false }: FiltersProps) {
  return (
    <aside className={twFromTokens(colors.surface, spacing.cardDefault, 'rounded', 'shadow')}>
      <div className={twFromTokens(spacing.formRow)}>
        <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween)}>
          <div className={twFromTokens(textSizes.lg, fontWeights.medium)}>{t('reports_filters.heading')}</div>
          <Button variant="ghost" size="sm" onClick={clearAll} className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>{t('reports_filters.clear')}</Button>
        </div>
      </div>

    <div className={twFromTokens(spacing.formRow)}>
  <label className={twFromTokens(spacing.formLabel, textSizes.sm, fontWeights.medium)}>{t('reports_filters.search_label')}</label>
  <input value={query} onChange={(e) => setQuery(e.target.value)} className={twFromTokens(spacing.input, colors.mutedBorder, textSizes.sm)} placeholder={t('reports_filters.search_placeholder')} />
    </div>

      <div className={twFromTokens(spacing.formRow)}>
        <label className={twFromTokens(spacing.formLabel, textSizes.sm, fontWeights.medium)}>{t('reports_filters.verdict_status_label')}</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={twFromTokens(spacing.input, colors.mutedBorder)}>
          <option value="all">{t('reports_filters.option_all')}</option>
          <option value="compliant">{t('reports_filters.option_compliance')}</option>
          {verdictOptions.filter(v => v !== 'compliant').map((v) => (
            <option key={v} value={v}>{v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
          <option value="full">{t('reports_filters.option_full')}</option>
        </select>
      </div>

      <div className={twFromTokens(spacing.formRow)}>
  <label className={twFromTokens(spacing.formLabel, textSizes.sm, fontWeights.medium)}>{t('reports_filters.date_range')}</label>
        <div className={twFromTokens(alignment.flexRow, alignment.gap2)}>
          <input type="date" value={toIso(startDate)} onChange={(e) => setStartDate(e.target.value)} className={twFromTokens(colors.mutedBorder, spacing.input, 'w-1/2')} />
          <input type="date" value={toIso(endDate)} onChange={(e) => setEndDate(e.target.value)} className={twFromTokens(colors.mutedBorder, spacing.input, 'w-1/2')} />
        </div>
      </div>
      {/* Small progress indicator shown while reports are loading; hidden when filters are collapsed */}
      {isLoading && (
        <div className={twFromTokens(spacing.progressTop)}>
          <div className={twFromTokens(spacing.progressBarContainer, colors.surfaceMuted)}>
            <div className={twFromTokens(spacing.progressBarInner, 'bg-gradient-to-r', 'from-blue-500', 'to-blue-700', 'animate-[progress_1.6s_linear_infinite]')} style={{ width: '60%' }} />
          </div>
        </div>
      )}
    </aside>
  )
}
