import { twFromTokens, colors, textSizes, fontWeights } from '@/styles/styleTokens'

export function badgeClass(isPro: boolean) {
  return twFromTokens('px-3 py-1 rounded-full', textSizes.sm, fontWeights.medium, isPro ? colors.primaryBgLight : colors.successBg, isPro ? colors.primaryMuted : colors.success)
}

export function badgeText(isPro: boolean) {
  return isPro ? 'PRO' : 'FREE'
}

export function formatCredits(total: number) {
  return String(total)
}
