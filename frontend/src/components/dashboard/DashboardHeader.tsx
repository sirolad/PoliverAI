import useDashboardHeader from '@/hooks/useDashboardHeader'
import { twFromTokens, textSizes, colors, fontWeights } from '@/styles/styleTokens'

export default function DashboardHeader() {
  const { title, subtitle } = useDashboardHeader()

  return (
    <div className="mb-8">
      <h1 className={twFromTokens(textSizes.h2, fontWeights.bold, colors.textPrimary, 'mb-2')}>{title}</h1>
      <p className={twFromTokens(textSizes.md, colors.textMuted)}>{subtitle}</p>
    </div>
  )
}
