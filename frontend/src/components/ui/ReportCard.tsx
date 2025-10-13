import React from 'react'
import type { ReportMetadata } from '@/types/api'
import { Star, StarHalf, Star as StarEmpty } from 'phosphor-react'
import { DownloadCloud, ExternalLink } from 'lucide-react'
import { twFromTokens, textSizes, colors, fontWeights, baseFontSizes, hoverFromColor } from '@/styles/styleTokens'
import { Button } from './Button'
import { t } from '@/i18n'
import policyService from '@/services/policyService'
import { normalizeStatus, isFullReport, getStarCounts, formatFileSize, formatDateTime } from '@/lib/reportHelpers'

type Props = {
  report: ReportMetadata
  selected?: boolean
  onToggleSelect?: (filename: string) => void
  onOpen: (r: ReportMetadata) => void
  onDownload: (r: ReportMetadata) => void
  onExternalOpen?: (r: ReportMetadata) => void
}

export default function ReportCard({ report: r, selected, onToggleSelect, onOpen, onDownload, onExternalOpen }: Props) {
  const score = typeof r.score === 'number' ? Math.max(0, Math.min(100, r.score)) : undefined
  const hasStars = score != null
  const isFull = isFullReport(r)
  const vnorm = normalizeStatus((r.verdict || r.status) as string)
  const hasVerdict = Boolean(r.verdict)
  const hasExtraContent = hasStars || isFull || hasVerdict || Boolean(r.file_size) || Boolean(r.document_name)
  const cardMinHeightClass = hasExtraContent ? 'card-min-h-mobile-long md:min-h-0' : 'card-min-h-mobile md:min-h-0'

  return (
    <div className={`${cardMinHeightClass} p-4 border rounded grid grid-cols-12 gap-4 items-start md:flex md:items-center ${selected ? twFromTokens(colors.primaryBorder, colors.primaryBgLight) : ''}`}>
      <div className="col-span-1 flex items-center h-full">
        <input
          type="checkbox"
          checked={!!selected}
          onChange={() => onToggleSelect && onToggleSelect(r.filename)}
          className="w-4 h-4"
          aria-label={t('report_card.select_aria', { filename: r.filename })}
        />
      </div>
      <div className="col-span-10 flex-1">
    <div className={twFromTokens(fontWeights.semibold)}>{r.title || r.document_name}</div>
    <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{r.document_name}</div>
    <div className={twFromTokens(textSizes.sm, colors.textMuted, 'mt-1')}>{formatDateTime(r.created_at)}</div>
    <div className={twFromTokens(textSizes.sm, colors.textMuted, 'truncate')}>{t('report_card.filename_label')} <span className="font-mono">{r.filename}</span></div>
        {r.file_size ? (
          <div className="text-sm text-gray-500">{t('report_card.size_label')} {formatFileSize(r.file_size)}</div>
        ) : null}

        <div className="mt-2 ml-2 mr-2 flex items-center gap-2">
          {(() => {
            if (score == null) return null
            const { full, half, empty, percentage } = getStarCounts(score)
              const icons: React.ReactElement[] = []
            for (let i = 0; i < full; i++) icons.push(<Star key={`f-${i}`} size={16} weight="fill" className={twFromTokens(colors.warning)} />)
            if (half) icons.push(<StarHalf key={`h`} size={16} weight="fill" className={twFromTokens(colors.warning)} />)
            for (let i = 0; i < empty; i++) icons.push(<StarEmpty key={`e-${i}`} size={16} weight="duotone" className={twFromTokens(colors.surface)} />)
            return (
              <div className={twFromTokens('flex', 'items-center', textSizes.sm, colors.textPrimary)}>
                <div className="flex items-center gap-0.5">{icons}</div>
                <div className={twFromTokens('ml-2', textSizes.sm, colors.textMuted)}>{percentage}%</div>
              </div>
            )
          })()}
        </div>

        {(() => {
          if (!isFull && !hasVerdict) return null
          return (
            <div className={twFromTokens('inline-flex items-center mt-2 rounded overflow-hidden', baseFontSizes.xs, fontWeights.medium)}>
              {isFull ? (
                <div className={twFromTokens('px-2 py-1 border border-r-0', colors.successBg, colors.success)}>{t('report_card.full_label')}</div>
              ) : null}
              {hasVerdict ? (
                <div className={twFromTokens('px-2 py-1 border', vnorm === 'compliant' ? colors.successBg : vnorm === 'partially_compliant' ? colors.warningBg : colors.dangerBg, vnorm === 'compliant' ? colors.success : vnorm === 'partially_compliant' ? colors.warning : colors.danger)}>
                  {String(r.verdict).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </div>
              ) : null}
            </div>
          )
        })()}
      </div>
      <div className={`col-span-1 flex-shrink-0 ml-0 md:ml-4 flex items-center space-x-2 w-full md:w-auto justify-end self-end`}>
        {r.gcs_url ? (
          <Button onClick={() => (onExternalOpen ? onExternalOpen(r) : policyService.openReport(r))} className={twFromTokens('text-sm px-3 py-1 rounded', colors.mutedActionBg, colors.onPrimary)} icon={<ExternalLink className={twFromTokens('h-4 w-4', colors.onPrimary)} />} iconColor="text-white" collapseToIcon>
            {t('report_card.open')}
          </Button>
        ) : null}
        <Button onClick={() => onOpen(r)} className={twFromTokens('text-sm px-3 py-1 rounded', colors.primaryBg, colors.onPrimary, hoverFromColor(colors.primary))} icon={<ExternalLink className={twFromTokens('h-4 w-4', colors.onPrimary)} />} collapseToIcon>
          {t('report_card.view')}
        </Button>
        <Button onClick={() => onDownload(r)} className={twFromTokens(colors.ctaText, 'px-3 py-1 rounded', colors.successBg)} icon={<DownloadCloud className={twFromTokens('h-4 w-4', colors.onPrimary)} />} iconColor="text-white" collapseToIcon>
          {t('report_card.download')}
        </Button>
      </div>
    </div>
  )
}
