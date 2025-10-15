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
  itIsInNavBar?: boolean
}

export function composeButtonClass({ baseClass, collapseToIcon = false, canCollapse = true, hasBackground = true, textUnderline = false, itIsInNavBar = false }: ComposeButtonClassParams): string {
  const collapseClass = collapseToIcon && canCollapse ? 'collapse-to-icon' : ''
  let composed = `${baseClass} ${collapseClass}`.trim()

  // If the button is being used inside a nav menu (full-width items),
  // prefer left-aligned content so the icon sits at the left edge.
  if (itIsInNavBar) {
    // match the plain <Link> menu item look: full width, left-aligned, same padding and hover
    const navItemClass = 'w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 rounded-none'
    // remove conflicting layout/size/rounded utilities from the base so navItemClass wins
    composed = composed
      .replace(/\binline-flex\b/g, '')
      .replace(/\bjustify-center\b/g, '')
      .replace(/\bwhitespace-nowrap\b/g, '')
      .replace(/\brounded-md\b/g, '')
      .replace(/\bh-\d+\b/g, '')
      .replace(/\bpx-\d+\b/g, '')
      .replace(/\bpy-\d+\b/g, '')
      .replace(/\btext-sm\b/g, '')
      .replace(/\bfont-medium\b/g, '')
      .replace(/\bitems-center\b/g, '')
      .replace(/\bjustify-start\b/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    composed = `${composed} ${navItemClass} justify-start`.trim()
  }

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
