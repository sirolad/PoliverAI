import { Progress } from '@/components/ui/progress'
import useAnalysisProgress from '@/hooks/useAnalysisProgress'
import { twFromTokens, textSizes, colors, alignment, spacing } from '@/styles/styleTokens'

type Props = {
  message?: string | null
  progress?: number | null
  className?: string
}

export default function AnalysisProgress({ message, progress, className = '' }: Props) {
  const { displayMessage, percent } = useAnalysisProgress(message, progress)

  return (
    <div className={twFromTokens(spacing.smallTop, className, spacing.blockSmall)}>
      <div className={twFromTokens(alignment.flexRow, alignment.justifyBetween, spacing.tinyTop, spacing.blockSmall)}>
        <div className={twFromTokens(textSizes.sm, colors.textSecondary)}>{displayMessage}</div>
        <div className={twFromTokens(textSizes.sm, colors.textMuted)}>{percent}%</div>
      </div>
      <Progress value={percent} className={twFromTokens('h-2')} />
    </div>
  )
}
