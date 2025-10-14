export type DetermineIconColorParams = {
  iconColor?: string | undefined
  iconTheme?: 'dark' | 'light' | 'auto'
  className?: string | undefined
  variant?: string | null | undefined
}

export function determineIconColorClass({ iconColor, iconTheme = 'auto', className, variant }: DetermineIconColorParams): string {
  if (typeof iconColor === 'string' && iconColor.trim().length > 0) return iconColor
  if (iconTheme === 'dark') return '#000'
  if (iconTheme === 'light') return '#fff'
  return '#000'
}

export type ComposeButtonClassParams = {
  baseClass: string
  collapseToIcon?: boolean
  canCollapse?: boolean
  hasBackground?: boolean
  textUnderline?: boolean
  itIsInNavBar?: boolean
}

export function composeButtonClass({ baseClass }: ComposeButtonClassParams): string {
  // RN components will compute actual style objects; return simplified key for now
  return baseClass || 'button'
}
