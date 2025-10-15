type NavLinkItem = {
  to: string
  key: string // locale key
  show: boolean
}

export default function useNavLinks(isPro: boolean, reportsCount?: number | null): NavLinkItem[] {
  const links: NavLinkItem[] = [
    { to: '/dashboard', key: 'navbar.dashboard', show: true },
    { to: '/analyze', key: 'navbar.analyze_policy', show: true },
    { to: '/reports', key: 'navbar.reports', show: Boolean(isPro || (typeof reportsCount === 'number' && reportsCount > 0)) },
    { to: '/credits', key: 'navbar.transaction_history', show: true },
  ]
  return links
}
