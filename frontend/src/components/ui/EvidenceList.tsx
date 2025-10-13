import { FileText, FileSearch } from 'lucide-react'
import { t } from '@/i18n'
import { twFromTokens, baseFontSizes, fontWeights, colors } from '@/styles/styleTokens'

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
    <div className="mt-4">
      <div className={twFromTokens(baseFontSizes.sm, fontWeights.medium, colors.textSecondary, 'flex items-center gap-2')}>
        <FileSearch className={twFromTokens('h-4 w-4', colors.textMuted)} />
        <span>{t('policy_analysis.evidence_heading') || 'Evidence'}</span>
        <div className={twFromTokens('px-2 py-0.5 rounded', baseFontSizes.xs, colors.textMuted, colors.surfaceMuted)}>{`(${count})`}</div>
      </div>
      <div className="mt-2 space-y-2">
        {items.length > 0 ? (
          items.map((ev, i) => (
            <div key={i} className={twFromTokens('p-3 rounded shadow', colors.success, colors.onPrimary)}>
              <div className="flex items-start gap-3">
                <div className={twFromTokens('p-2 rounded', 'flex-shrink-0', 'bg-white/10')}>
                  <FileText className={twFromTokens('h-5 w-5', colors.onPrimary)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={twFromTokens(fontWeights.semibold, 'break-words')}>{String(ev['article'] ?? '')}</div>
                  <div className={twFromTokens(baseFontSizes.xs, 'mt-1 whitespace-pre-wrap break-words')}>{String(ev['policy_excerpt'] ?? '')}</div>
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
