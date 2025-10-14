import { twFromTokens, colors, textSizes, fontWeights, spacing } from '@/styles/styleTokens'

export function badgeClass(isPro: boolean) {
  return twFromTokens(spacing.badgePadding, 'rounded-full', textSizes.sm, fontWeights.medium, isPro ? colors.primaryBgLight : colors.successBg, isPro ? colors.primaryOnLight : colors.success)
}

export function badgeText(isPro: boolean, hasPlanText?: boolean) {
  return isPro ? `PRO${(hasPlanText) ? ' PLAN' : ''}`     : 'FREE'
}

export function formatCredits(total: number) {
  return String(total)
}
