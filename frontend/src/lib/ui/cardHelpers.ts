import { cn } from '@/lib/utils'
import { twFromTokens, spacing, alignment, textSizes, fontWeights, colors } from '@/styles/styleTokens'

export function getCardClassName(extra?: string) {
  // Map the previous design tokens to centralized tokens: surface bg, muted border, rounded + shadow
  return cn(twFromTokens('rounded-lg', 'border', colors.mutedBorder, colors.surface, colors.textPrimary, 'shadow-sm'), extra)
}

export function getCardHeaderClassName(extra?: string) {
  // Previously: flex flex-col space-y-1.5 p-6
  return cn(twFromTokens(alignment.flexCol, alignment.gap2, spacing.modalPadding), extra)
}

export function getCardTitleClassName(extra?: string) {
  // Previously: text-2xl font-semibold leading-none tracking-tight
  return cn(twFromTokens(textSizes.h3, fontWeights.semibold, 'leading-none', 'tracking-tight'), extra)
}

export function getCardDescriptionClassName(extra?: string) {
  // Previously: text-sm text-muted-foreground
  return cn(twFromTokens(textSizes.sm, colors.textMuted), extra)
}

export function getCardContentClassName(extra?: string) {
  // Previously: p-6 pt-0
  return cn(twFromTokens(spacing.modalPadding, 'pt-0'), extra)
}

export function getCardFooterClassName(extra?: string) {
  // Previously: flex items-center p-6 pt-0
  return cn(twFromTokens(alignment.flexRow, alignment.itemsCenter, spacing.modalPadding, 'pt-0'), extra)
}
