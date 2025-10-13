import { UploadCloud } from 'lucide-react'
import useNoAnalysisTexts from '@/hooks/useNoAnalysisTexts'
import { twFromTokens, colors, baseFontSizes, fontWeights } from '@/styles/styleTokens'

type Props = {
  className?: string
}

export default function NoAnalysisView({ className = '' }: Props) {
  const { title, desc } = useNoAnalysisTexts()

  return (
    <div className={`h-full w-full flex items-center justify-center ${className}`}>
      <div className="text-center p-6">
        <div className={twFromTokens('mx-auto flex items-center justify-center rounded-full', 'w-24 h-24', colors.surfaceMuted)}>
          <UploadCloud className={twFromTokens('h-10 w-10', colors.textMuted)} />
        </div>
        <div className={twFromTokens('mt-4', fontWeights.semibold, baseFontSizes.lg)}>{title}</div>
        <div className={twFromTokens('mt-2', baseFontSizes.sm, colors.textMutedLight)}>{desc}</div>
      </div>
    </div>
  )
}
