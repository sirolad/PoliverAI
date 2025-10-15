import { twFromTokens, baseFontSizes, fontWeights, colors, spacing, alignment } from '@/styles/styleTokens'

type Evidence = { article?: string | number; policy_excerpt?: string }
export default function EvidenceItem({ article, policy_excerpt }: Evidence) {
  return (
    <div className={twFromTokens(spacing.cardDefault, 'rounded shadow', colors.success, colors.onPrimary)}>
      <div className={twFromTokens(alignment.flexRow, alignment.itemsStart, alignment.gap3)}>
        <div className={twFromTokens(spacing.iconWrapperCompact, 'rounded bg-white/10 flex-shrink-0')}>
          <svg className={twFromTokens(spacing.iconsMd, colors.onPrimary)} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
        </div>
        <div className={twFromTokens('flex-1 min-w-0')}>
          <div className={twFromTokens(fontWeights.semibold, 'break-words')}>{article}</div>
          <div className={twFromTokens(baseFontSizes.xs, spacing.tinyTop, 'whitespace-pre-wrap break-words')}>{policy_excerpt}</div>
        </div>
      </div>
    </div>
  )
}
