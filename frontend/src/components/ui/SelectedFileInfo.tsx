import useSelectedFileInfo from '@/hooks/useSelectedFileInfo'
import { twFromTokens, textSizes, baseFontSizes, fontWeights, colors, spacing, alignment } from '@/styles/styleTokens'

type Props = {
  file: File | null
  className?: string
}

export default function SelectedFileInfo({ file, className = '' }: Props) {
  const { label, meta } = useSelectedFileInfo(file)

  return (
    <div className={twFromTokens(spacing.smallTop, textSizes.sm, colors.textSecondary, className)}>
      <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, fontWeights.medium)}>{label}</div>
      <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{meta}</div>
    </div>
  )
}
