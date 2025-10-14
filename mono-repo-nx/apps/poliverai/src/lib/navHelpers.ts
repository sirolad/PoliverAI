export function badgeText(isPro: boolean, hasPlanText?: boolean) {
  return isPro ? `PRO${hasPlanText ? ' PLAN' : ''}` : 'FREE'
}

export function formatCredits(total: number) {
  return String(total)
}
