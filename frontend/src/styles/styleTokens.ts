// Centralized style tokens for text sizes, colors, and font presets.
// These tokens provide both Tailwind utility class names (for the web)
// and numeric/native values (for React Native). The file now exposes a
// small set of primitive tokens (base sizes, palette) and higher-level
// semantic tokens that reference those primitives. That lets multiple
// semantic tokens share the same underlying number or color reference.

// Base font-size scale (shared references). Use these when you want
// multiple semantic sizes to refer to the exact same numeric value.
export const baseFontSizes = {
  xs: { tw: 'text-xs', size: 12 },
  sm: { tw: 'text-sm', size: 14 },
  md: { tw: 'text-base', size: 16 },
  lg: { tw: 'text-lg', size: 18 },
  xl: { tw: 'text-xl', size: 20 },
  '2xl': { tw: 'text-2xl', size: 24 },
  '3xl': { tw: 'text-3xl', size: 30 },
  '5xl': { tw: 'text-5xl', size: 48 },
}

// Semantic text sizes that point to the base scale. If two semantic
// sizes point to the same base size they will share the same object
// reference, making edits centrally effective.
export const textSizes = {
  h1: baseFontSizes['5xl'],
  h2: baseFontSizes['3xl'],
  lead: baseFontSizes.xl,
  lg: baseFontSizes.lg,
  md: baseFontSizes.md,
  sm: baseFontSizes.sm,
}

// Font weights: tailwind class + numeric weight. These are small
// objects so sharing is easy if needed later.
export const fontWeights = {
  bold: { tw: 'font-bold', weight: '700' },
  semibold: { tw: 'font-semibold', weight: '600' },
  medium: { tw: 'font-medium', weight: '500' },
  normal: { tw: 'font-normal', weight: '400' },
}

// Core color palette. Use palette entries when you want literal color
// values that may be shared across multiple semantic color tokens.
// Expanded core color palette that mirrors common Tailwind shades used in
// the app. Each palette entry is a single shared color reference that
// semantic color tokens can point to. This makes it easy to change a
// shade in one place and have many semantic colors update.
export const palette = {
  // grays
  gray900: '#111827',
  gray800: '#1F2937',
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50:  '#FAFAFA',

  // blues
  blue600: '#2563EB',
  blue500: '#3B82F6',
  blue100: '#DBEAFE',

  // greens
  green600: '#16A34A',
  green100: '#DCFCE7',

  // yellows
  yellow600: '#D97706',
  yellow100: '#FEF3C7',

  // reds
  red600: '#DC2626',
  red100: '#FEE2E2',

  white: '#FFFFFF',
}

function makeColor(twClass: string, hexKey: keyof typeof palette) {
  return { tw: twClass, hex: palette[hexKey] }
}

// Semantic colors referencing the palette. Keep these stable so UI code
// can rely on names like `textMuted` or `success` rather than literal
// Tailwind classes. Many semantic tokens intentionally point to the
// same palette entry so edits are centralized.
export const colors = {
  // text
  textPrimary: makeColor('text-gray-900', 'gray900'),
  textSecondary: makeColor('text-gray-700', 'gray700'),
  textMuted: makeColor('text-gray-600', 'gray600'),
  textMutedLight: makeColor('text-gray-500', 'gray500'),
  // lighter text useful for small icons and muted labels (maps to gray-300)
  textLight: makeColor('text-gray-300', 'gray300'),

  // surfaces / backgrounds
  surface: makeColor('bg-white', 'white'),
  surfaceMuted: makeColor('bg-gray-100', 'gray100'),
  // page background (very light gray)
  pageBg: makeColor('bg-gray-50', 'gray50'),
  // semi-opaque surface overlay used for modals and splash screens
  surfaceOverlay: makeColor('bg-white/90', 'white'),

  // brand
  primary: makeColor('text-blue-600', 'blue600'),
  primaryBg: makeColor('bg-blue-600', 'blue600'),
  primaryMuted: makeColor('text-blue-100', 'blue100'),
  // light primary background for UI elements that need a soft blue surface
  primaryBgLight: makeColor('bg-blue-100', 'blue100'),

  // semantic states
  success: makeColor('text-green-600', 'green600'),
  successBg: makeColor('bg-green-100', 'green100'),
  warning: makeColor('text-yellow-600', 'yellow600'),
  warningBg: makeColor('bg-yellow-100', 'yellow100'),
  danger: makeColor('text-red-600', 'red600'),
  dangerBg: makeColor('bg-red-100', 'red100'),

  // overlays
  overlayDark: makeColor('bg-black/50', 'gray900'),

  // utility
  mutedBorder: makeColor('border-gray-200', 'gray200'),
  // convenience alias for text placed on a primary-colored background
  onPrimary: makeColor('text-white', 'white'),
  ctaText: makeColor('text-white', 'white'),

  // border and strong-bg tokens for use where a solid color is needed
  primaryBorder: makeColor('border-blue-600', 'blue600'),
  successBgStrong: makeColor('bg-green-600', 'green600'),
  // utility for darker muted action buttons (used sparingly)
  mutedActionBg: makeColor('bg-gray-700', 'gray700'),
}

export const spacing = {
  sectionPaddingY: { tw: 'py-16', value: 64 },
  // responsive form/container spacing used across small UI fragments
  formContainer: { tw: 'mt-0 sm:mt-2 ml-2 sm:ml-0', value: null },
  // card padding for list items / small cards
  card: { tw: 'p-4', value: 16 },
  // form row spacing used for stacked form controls
  formRow: { tw: 'mb-4', value: 16 },
  // small form field spacing (tight rows)
  formRowSmall: { tw: 'mb-1', value: 4 },
  // label utilities for forms
  formLabel: { tw: 'block mb-1', value: null },
  // common input utility used across forms (full-width border + padding)
  input: { tw: 'w-full border px-2 py-1 rounded', value: null },
  // full width utility as a token for consistency
  fullWidth: { tw: 'w-full', value: null },
  // inner gaps used in card layouts
  cardInnerGap: { tw: 'gap-4', value: 16 },
  // general controls gap (used for right-side action cluster)
  controlsGap: { tw: 'gap-3', value: 12 },
  // badge padding and margin utilities
  badgePadding: { tw: 'px-2 py-1', value: null },
  badgeMarginLeft: { tw: 'ml-2', value: 8 },
  // small top margin
  smallTop: { tw: 'mt-2', value: 8 },
  // tiny top margin for subtle spacing
  tinyTop: { tw: 'mt-1', value: 4 },
  // section divider height/width utilities
  dividerShort: { tw: 'w-36 h-1 rounded-full my-6', value: null },
  // container spacing (used on landing sections)
  sectionContainer: { tw: 'container mx-auto px-4 py-12', value: null },
  // heading bottom margin used across landing/section headings
  headingMargin: { tw: 'mb-4', value: 16 },
}

// Alignment tokens: centralized flex/grid alignment utilities so components
// can consistently reference alignment concerns from one place. These
// are minimal and intentionally map to small Tailwind utility groups so
// they can be composed with `twFromTokens` together with spacing tokens.
export const alignment = {
  flexRow: { tw: 'flex flex-row' },
  flexCol: { tw: 'flex flex-col' },
  itemsCenter: { tw: 'items-center' },
  itemsStart: { tw: 'items-start' },
  itemsEnd: { tw: 'items-end' },
  justifyCenter: { tw: 'justify-center' },
  justifyBetween: { tw: 'justify-between' },
  justifyStart: { tw: 'justify-start' },
  justifyEnd: { tw: 'justify-end' },
  // common convenience presets
  center: { tw: 'flex items-center justify-center' },
  centerColumn: { tw: 'flex flex-col items-center justify-center' },
}

// Convenience font presets that bundle size + weight (referencing the
// semantic tokens above). These presets are helpful for porting — you
// can map a preset to either a Tailwind class string or an RN style.
export const fontPresets = {
  // High-level presets reference semantic textSizes which in turn point to
  // the same baseFontSizes objects. That way if multiple presets use the
  // same underlying size they share the same object reference.
  heading: { size: textSizes.h1, weight: fontWeights.bold },
  subheading: { size: textSizes.h2, weight: fontWeights.semibold },
  lead: { size: textSizes.lead, weight: fontWeights.medium },
  body: { size: textSizes.md, weight: fontWeights.normal },
  small: { size: textSizes.sm, weight: fontWeights.normal },

  // aliases for portability: mapping more descriptive names that RN or
  // design systems may expect.
  title: { size: textSizes.h2, weight: fontWeights.bold },
  caption: { size: textSizes.sm, weight: fontWeights.normal },
}

// Helper: build a Tailwind class string from a list of token objects
// and/or raw classes. Accepts primitives (strings) or token objects
// that contain a `tw` property.
export function twFromTokens(...items: Array<string | { tw?: string } | undefined>) {
  const parts: string[] = []
  items.forEach((it) => {
    if (!it) return
    if (typeof it === 'string') parts.push(it)
    else if (typeof it === 'object' && it.tw) parts.push(it.tw)
  })
  return parts.join(' ').trim()
}

// Helper: produce a hover class for a token that exposes a `tw` value.
// Example: hoverFromColor(colors.primary) -> 'hover:text-blue-600'
export function hoverFromColor(token?: { tw?: string } | string | undefined) {
  if (!token) return ''
  const tw = typeof token === 'string' ? token : (token.tw ?? '')
  if (!tw) return ''
  return `hover:${tw}`
}

// Helper to produce a hover background class from a color token that has a
// background utility (e.g. colors.surfaceMuted.tw -> 'bg-gray-100').
export function hoverBgFromColor(token?: { tw?: string } | string | undefined) {
  if (!token) return ''
  const tw = typeof token === 'string' ? token : (token.tw ?? '')
  if (!tw) return ''
  // If token already is a bg- utility, prefix with hover:, otherwise no-op
  if (tw.startsWith('bg-')) return `hover:${tw}`
  return ''
}

// Helper: produce a React Native / web style object from tokens or a
// font preset. Accepts keys that reference the exported maps above.
export function rnStyleFromTokens(opts: {
  size?: keyof typeof textSizes | null
  color?: keyof typeof colors | null
  weight?: keyof typeof fontWeights | null
  lineHeight?: number | null
}) {
  const style: Record<string, string | number> = {}
  if (opts.size) {
    const s = textSizes[opts.size]
    if (s && typeof s.size === 'number') style.fontSize = s.size
  }
  if (opts.color) {
    const c = colors[opts.color]
    if (c && typeof c.hex === 'string') style.color = c.hex
  }
  if (opts.weight) {
    const w = fontWeights[opts.weight]
    if (w && w.weight) style.fontWeight = w.weight
  }
  if (opts.lineHeight) style.lineHeight = opts.lineHeight
  return style
}

export default {
  baseFontSizes,
  textSizes,
  fontWeights,
  palette,
  colors,
  spacing,
  fontPresets,
  twFromTokens,
  rnStyleFromTokens,
}
