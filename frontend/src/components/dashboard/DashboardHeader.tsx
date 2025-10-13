import useDashboardHeader from '@/hooks/useDashboardHeader'
import { twFromTokens, textSizes, colors, fontWeights, spacing } from '@/styles/styleTokens'

export default function DashboardHeader() {
  const { title, subtitle } = useDashboardHeader()

  return (
    <div className={twFromTokens(spacing.headingLarge)}>
      <h1 className={twFromTokens(textSizes.h2, fontWeights.bold, colors.textPrimary, spacing.headingMargin)}>{title}</h1>
      <p className={twFromTokens(textSizes.md, colors.textMuted)}>{subtitle}</p>
    </div>
  )
}
