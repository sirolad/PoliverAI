import { twFromTokens, colors, textSizes } from '@/styles/styleTokens'

export function getCurrentYear(): number {
  return new Date().getFullYear()
}

export function footerClasses(hasBackground: boolean) {
  const bgClass = hasBackground ? twFromTokens(colors.primaryBg, colors.onPrimary) : twFromTokens('bg-transparent', colors.textSecondary)
  const subtitleClass = hasBackground ? twFromTokens(colors.primaryMuted) : twFromTokens(textSizes.sm, colors.textMutedLight)
  return { bgClass, subtitleClass }
}
