import { FileText, FileSearch } from 'lucide-react'
import { t } from '@/i18n'
import { twFromTokens, baseFontSizes, fontWeights, colors, spacing, alignment } from '@/styles/styleTokens'

type EvidenceItem = Record<string, unknown>

type Props = {
  evidence?: Array<EvidenceItem> | null
  limit?: number
}

/**
 * Presentational evidence list used in PolicyAnalysis. Keeps markup focused
 * and small; does not manage fetching or side-effects.
 */
export default function EvidenceList({ evidence, limit = 6 }: Props) {
  const items = (evidence || []).slice(0, limit)
  const count = (evidence || []).length

  return (
    <div className={twFromTokens(spacing.smallTop)}>
      <div className={twFromTokens(baseFontSizes.sm, fontWeights.medium, colors.textSecondary, alignment.flexRow, alignment.itemsCenter, alignment.gap2)}>
        <FileSearch className={twFromTokens(spacing.iconsXs, colors.textMuted)} />
        <span>{t('policy_analysis.evidence_heading') || 'Evidence'}</span>
        <div className={twFromTokens(spacing.badgePadding, baseFontSizes.xs, colors.textMuted, colors.surfaceMuted)}>{`(${count})`}</div>
      </div>
      <div className={twFromTokens(spacing.tinyTop, alignment.flexCol, alignment.gap2)}>
        {items.length > 0 ? (
          items.map((ev, i) => (
            <div key={i} className={twFromTokens(spacing.cardDefault, 'rounded shadow', colors.greenBg, colors.onPrimary)}>
              <div className={twFromTokens(alignment.flexRow, alignment.itemsStart, alignment.gap3)}>
                <div className={twFromTokens(spacing.iconWrapperCompact, 'rounded bg-white/10 flex-shrink-0')}>
                  <FileText className={twFromTokens(spacing.iconsMd, colors.onPrimary)} />
                </div>
                <div className={twFromTokens('flex-1 min-w-0')}>
                  <div className={twFromTokens(fontWeights.semibold, 'break-words')}>{String(ev['article'] ?? '')}</div>
                  <div className={twFromTokens(baseFontSizes.xs, spacing.tinyTop, 'whitespace-pre-wrap break-words')}>{String(ev['policy_excerpt'] ?? '')}</div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={twFromTokens(baseFontSizes.sm, colors.textMuted)}>{t('policy_analysis.no_evidence_excerpts') || 'No evidence excerpts'}</div>
        )}
      </div>
    </div>
  )
}
