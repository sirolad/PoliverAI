import React from 'react'
import { Button } from '@/components/ui/Button'
import { twFromTokens, textSizes, colors, spacing, alignment } from '@/styles/styleTokens'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ReportMetadata } from '@/types/api'
import { t } from '@/i18n'

type Props = {
  filtered: ReportMetadata[]
  selectedFiles: Record<string, boolean>
  setSelectedFiles: React.Dispatch<React.SetStateAction<Record<string, boolean>>> 
  isLoading: boolean
  total: number | null
  limit: number
  setLimit: React.Dispatch<React.SetStateAction<number>>
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  totalPages: number
}

function useSelectAll(
  filtered: ReportMetadata[],
  selectedFiles: Record<string, boolean>,
  setSelectedFiles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
) {
  const allSelected = React.useMemo(() => filtered.length > 0 && filtered.every((f) => !!selectedFiles[f.filename]), [filtered, selectedFiles])

  const toggleAll = React.useCallback(() => {
    const all = filtered.length > 0 && filtered.every((f) => !!selectedFiles[f.filename])
    setSelectedFiles((prev) => {
      const next = { ...prev }
      filtered.forEach((f) => { next[f.filename] = !all })
      return next
    })
  }, [filtered, selectedFiles, setSelectedFiles])

  return { allSelected, toggleAll }
}

function usePagination(
  page: number,
  setPage: React.Dispatch<React.SetStateAction<number>>,
  limit: number,
  setLimit: React.Dispatch<React.SetStateAction<number>>,
  totalPages: number
) {
  // keep references to page/limit so linters don't complain
  React.useMemo(() => page, [page])
  React.useMemo(() => limit, [limit])
  const onPrev = React.useCallback(() => setPage((p) => Math.max(1, p - 1)), [setPage])
  const onNext = React.useCallback(() => setPage((p) => Math.min(totalPages, p + 1)), [setPage, totalPages])
  const onChangeLimit = React.useCallback((n: number) => { setPage(1); setLimit(n) }, [setPage, setLimit])
  return { onPrev, onNext, onChangeLimit }
}

export default function ReportsToolbar({ filtered, selectedFiles, setSelectedFiles, isLoading, total, limit, setLimit, page, setPage, totalPages }: Props) {
  const { allSelected, toggleAll } = useSelectAll(filtered, selectedFiles, setSelectedFiles)
  const { onPrev, onNext, onChangeLimit } = usePagination(page, setPage, limit, setLimit, totalPages)

  return (
  <div className={twFromTokens(spacing.formRow, alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween)}>
    <div>
      <label className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap2, textSizes.sm, colors.textPrimary, spacing.badgeMarginLeft)}>
            <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label={filtered.length > 0 ? t('toolbar.select_all_aria_count', { count: filtered.length }) : t('toolbar.select_all_aria_all')}
            />
            <span className={twFromTokens(textSizes.sm, 'hide-below-700')}>{t('toolbar.select_all')}</span>

            <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{isLoading ? t('toolbar.results_loading') : (total != null ? t('toolbar.results_with_total', { visible: filtered.length, total }) : t('toolbar.results', { visible: filtered.length }))}</div>
        </label>
      </div>
      <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap3)}>
        <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap3, spacing.badgeMarginLeft)}>
          <label className={twFromTokens(textSizes.sm, colors.textMuted, 'hide-below-700')}>{t('toolbar.per_page')}</label>
          <select value={limit} onChange={(e) => onChangeLimit(Number(e.target.value))} className={twFromTokens(colors.mutedBorder, 'rounded', spacing.input, 'hide-below-700')}>
            {[10,20,30,40,50].map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={onPrev} className={twFromTokens(alignment.flexRow, alignment.itemsCenter)} icon={<ChevronLeft className={twFromTokens(spacing.iconsXs, colors.textMuted)} />}><span className="hide-below-700">{t('toolbar.prev')}</span></Button>
          <div className={twFromTokens(spacing.badgePadding, textSizes.sm)}>{page} / {totalPages}</div>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={onNext} className={twFromTokens(alignment.flexRow, alignment.itemsCenter)} icon={<ChevronRight className={twFromTokens(spacing.iconsXs, colors.textMuted)} />}><span className="hide-below-700">{t('toolbar.next')}</span></Button>
        </div>
      </div>
    </div>
  )
}
