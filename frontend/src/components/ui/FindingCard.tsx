import { t } from '@/i18n'
import { twFromTokens, colors, baseFontSizes, fontWeights, spacing, alignment } from '@/styles/styleTokens'

type Finding = { article?: string | number; issue?: string; confidence?: number; severity?: 'high' | 'medium' | 'low' | string }
type Props = { finding: Finding }

export default function FindingCard({ finding }: Props) {
  const sev = finding.severity
  const bgToken = sev === 'high' ? colors.dangerBg : sev === 'medium' ? colors.warningBg : colors.successBg
  return (
    <div className={twFromTokens(bgToken, spacing.cardDefault, 'rounded shadow')}>
      <div className={twFromTokens(alignment.flexRow, alignment.itemsStart, alignment.gap3)}>
        <div className={twFromTokens(spacing.iconWrapperCompact, 'rounded bg-white/10 flex-shrink-0')}>
          {/* report/document icon */}
          <svg className={twFromTokens(spacing.iconsMd, colors.onPrimary)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M6 2a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H6zm7 1.5L19.5 10H13V3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
          </svg>
        </div>
        <div className={twFromTokens('flex-1 min-w-0')}>
          <div className={twFromTokens(fontWeights.semibold, baseFontSizes.sm, colors.onPrimary, 'break-words')}>{t('finding_card.article', { num: finding.article ?? '' })}</div>
          <div className={twFromTokens(baseFontSizes.sm, colors.onPrimary, spacing.tinyTop, 'break-words whitespace-pre-wrap')}>{finding.issue}</div>
          <div className={twFromTokens(baseFontSizes.xs, colors.onPrimary, spacing.tinyTop, 'text-white/90')}>{t('finding_card.confidence', { pct: ((finding.confidence ?? 0) * 100).toFixed(0) })}</div>
        </div>
      </div>
    </div>
  )
}
