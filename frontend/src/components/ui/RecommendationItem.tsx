import { twFromTokens, baseFontSizes, colors } from '@/styles/styleTokens'

type Recommendation = { suggestion?: string; article?: string | number }
export default function RecommendationItem({ suggestion, article }: Recommendation) {
  return <li>{suggestion} <span className={twFromTokens(baseFontSizes.xs, colors.textMutedLight)}>({article})</span></li>
}
