export function badgeClass(isPro: boolean) {
  return isPro ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
}

export function badgeText(isPro: boolean) {
  return isPro ? 'PRO' : 'FREE'
}

export function formatCredits(total: number) {
  return String(total)
}
