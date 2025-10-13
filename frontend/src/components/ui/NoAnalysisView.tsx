import { UploadCloud } from 'lucide-react'
import useNoAnalysisTexts from '@/hooks/useNoAnalysisTexts'
import { twFromTokens, colors, baseFontSizes, fontWeights, spacing, alignment } from '@/styles/styleTokens'

type Props = {
  className?: string
}

export default function NoAnalysisView({ className = '' }: Props) {
  const { title, desc } = useNoAnalysisTexts()

  return (
    <div className={twFromTokens('h-full w-full', alignment.center, className)}>
      <div className={twFromTokens('text-center', spacing.modalPadding)}>
        <div className={twFromTokens('mx-auto flex items-center justify-center rounded-full', spacing.emptyOuterMd, colors.surfaceMuted)}>
          <UploadCloud className={twFromTokens(spacing.emptyIconMd, colors.textMuted)} />
        </div>
        <div className={twFromTokens(spacing.sectionButtonTop, fontWeights.semibold, baseFontSizes.lg)}>{title}</div>
        <div className={twFromTokens(spacing.smallTop, baseFontSizes.sm, colors.textMutedLight)}>{desc}</div>
      </div>
    </div>
  )
}
