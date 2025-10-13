import { twFromTokens, baseFontSizes, colors, spacing, alignment } from '@/styles/styleTokens'

type Recommendation = { suggestion?: string; article?: string | number }
export default function RecommendationItem({ suggestion, article }: Recommendation) {
  return (
    <li className={twFromTokens(alignment.flexRow, alignment.itemsCenter, spacing.blockSmall)}>
      <span className="flex-1">{suggestion}</span>
      <span className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>({article})</span>
    </li>
  )
}
