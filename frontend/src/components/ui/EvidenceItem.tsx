import { twFromTokens, baseFontSizes, fontWeights, colors } from '@/styles/styleTokens'

type Evidence = { article?: string | number; policy_excerpt?: string }
export default function EvidenceItem({ article, policy_excerpt }: Evidence) {
  return (
    <div className={twFromTokens('p-3 rounded shadow', colors.success, colors.onPrimary)}>
      <div className="flex items-start gap-3">
        <div className={twFromTokens('p-2 rounded', 'flex-shrink-0', 'bg-white/10')}>
          <svg className={twFromTokens('h-5 w-5', colors.onPrimary)} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className={twFromTokens(fontWeights.semibold, 'break-words')}>{article}</div>
          <div className={twFromTokens(baseFontSizes.xs, 'mt-1 whitespace-pre-wrap break-words')}>{policy_excerpt}</div>
        </div>
      </div>
    </div>
  )
}
