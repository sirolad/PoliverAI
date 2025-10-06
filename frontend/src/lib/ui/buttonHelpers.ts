export interface DetermineIconColorParams {
  iconColor?: string | undefined
  iconTheme?: 'dark' | 'light' | 'auto'
  className?: string | undefined
  // variant can be null from VariantProps union
  variant?: string | null | undefined
}

export function determineIconColorClass({ iconColor, iconTheme = 'auto', className, variant }: DetermineIconColorParams): string {
  // explicit override
  if (typeof iconColor === 'string' && iconColor.trim().length > 0) return iconColor
  if (iconTheme === 'dark') return 'text-black'
  if (iconTheme === 'light') return 'text-white'
  // auto-detect
  const cnLower = String(className || '').toLowerCase()
  if (variant === 'outline' || variant === 'ghost' || variant === 'link') return 'text-black'
  if (cnLower.includes('bg-white') || cnLower.includes('bg-gray-50') || cnLower.includes('bg-gray-100') || cnLower.includes('bg-gray-200') || cnLower.includes('border')) return 'text-black'
  return 'text-white'
}

export interface ComposeButtonClassParams {
  baseClass: string
  collapseToIcon?: boolean
  canCollapse?: boolean
  hasBackground?: boolean
  textUnderline?: boolean
}

export function composeButtonClass({ baseClass, collapseToIcon = false, canCollapse = true, hasBackground = true, textUnderline = false }: ComposeButtonClassParams): string {
  const collapseClass = collapseToIcon && canCollapse ? 'collapse-to-icon' : ''
  let composed = `${baseClass} ${collapseClass}`.trim()

  if (!hasBackground) {
    // remove bg-*, border, shadow, ring classes that influence background/outline
    composed = composed
      .replace(/\bbg-[^\s]+\b/g, '')
      .replace(/\b(border|shadow|ring-[^\s]+|ring-offset-[^\s]+)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    composed = `${composed} bg-transparent`.trim()
  }

  if (textUnderline) {
    if (!/\bunderline\b/.test(composed)) composed = `${composed} underline`
  } else {
    composed = composed.replace(/\bunderline\b/g, '').replace(/\s+/g, ' ').trim()
  }

  return composed
}
