import useSelectedFileInfo from '@/hooks/useSelectedFileInfo'
import { twFromTokens, textSizes, baseFontSizes, fontWeights, colors } from '@/styles/styleTokens'

type Props = {
  file: File | null
  className?: string
}

export default function SelectedFileInfo({ file, className = '' }: Props) {
  const { label, meta } = useSelectedFileInfo(file)

  return (
    <div className={twFromTokens('mt-3', textSizes.sm, colors.textSecondary, className)}>
        <div className={twFromTokens(fontWeights.medium)}>{label}</div>
        <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>{meta}</div>
    </div>
  )
}
