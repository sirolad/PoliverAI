import { t } from '@/i18n'
import { twFromTokens, textSizes, colors, spacing, alignment, fontWeights } from '@/styles/styleTokens'

type Props = {
  downloadUrl: string | null
  filename?: string | null
}

export default function RevisedPolicyPreview({ downloadUrl, filename }: Props) {
  if (downloadUrl) {
    return (
      <div className={twFromTokens('h-full w-full min-h-0')}>
        <div className={twFromTokens(spacing.blockSmall, textSizes.sm, colors.textMuted)}>{t('policy_analysis.revised_policy_preview')}</div>
        <div className={twFromTokens('h-[70vh]')}>
          <iframe
            title={filename ?? 'revised-policy'}
            src={downloadUrl as string}
            className={twFromTokens('w-full h-full', 'border rounded')}
          />
        </div>
      </div>
    )
  }

  return (
    <div className={twFromTokens('h-full w-full', alignment.center)}>
      <div className={twFromTokens('text-center', spacing.cardLg)}>
        <div className={twFromTokens('mx-auto rounded-full', 'bg-gray-100', 'flex items-center justify-center', 'w-40 h-40')}>
          <svg className={twFromTokens('text-gray-400', 'h-20 w-20')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </div>
        <div className={twFromTokens(spacing.sectionButtonTop, textSizes.lg, fontWeights.semibold)}>{t('policy_analysis.nothing_here_generate')}</div>
        <div className={twFromTokens(spacing.smallTop, textSizes.sm, colors.textMutedLight)}>{t('policy_analysis.nothing_here_desc')}</div>
      </div>
    </div>
  )
}
