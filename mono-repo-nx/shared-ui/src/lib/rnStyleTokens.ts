import { StyleSheet } from 'react-native'

// Local token subset for RN usage. Keep minimal and extend as needed.
// These values are synced with frontend/src/styles/styleTokens.ts where possible
const tokens = {
  textSizes: {
    xs: { size: 12 },
    sm: { size: 14 },
    md: { size: 16 },
    lg: { size: 18 },
    xl: { size: 20 },
    '2xl': { size: 24 },
    '3xl': { size: 30 },
    '5xl': { size: 48 },
  },
  fontWeights: {
    bold: { weight: '700' },
    semibold: { weight: '600' },
    medium: { weight: '500' },
    normal: { weight: '400' },
  },
  colors: {
    // core palette
    gray900: { hex: '#111827' },
    gray800: { hex: '#1F2937' },
    gray700: { hex: '#374151' },
    gray600: { hex: '#4B5563' },
    gray500: { hex: '#6B7280' },
    gray400: { hex: '#9CA3AF' },
    gray300: { hex: '#D1D5DB' },
    gray200: { hex: '#E5E7EB' },
    gray100: { hex: '#F3F4F6' },
    gray50: { hex: '#FAFAFA' },

    blue600: { hex: '#2563EB' },
    blue500: { hex: '#3B82F6' },
    blue100: { hex: '#DBEAFE' },

    green600: { hex: '#16A34A' },
    green100: { hex: '#DCFCE7' },

    red600: { hex: '#DC2626' },
    red100: { hex: '#FEE2E2' },

    white: { hex: '#FFFFFF' },

    // semantic
    textPrimary: { hex: '#111827' },
    textSecondary: { hex: '#374151' },
    textMuted: { hex: '#4B5563' },
    surface: { hex: '#FFFFFF' },
    surfaceMuted: { hex: '#F3F4F6' },
    pageBg: { hex: '#FAFAFA' },
    primary: { hex: '#2563EB' },
    primaryBg: { hex: '#2563EB' },
    primaryBgLight: { hex: '#DBEAFE' },
    success: { hex: '#16A34A' },
    danger: { hex: '#DC2626' },
  },
  spacing: {
    card: 16,
    sectionPaddingY: 64,
    small: 8,
    medium: 16,
    large: 24,
    // more tokens aligned with web spacing map
    formRow: 16,
    formRowSmall: 4,
    buttonSmall: 8,
    cardDefault: 12,
    cardLg: 40,
    iconMd: 24,
  },
  buttons: {
    base: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
    small: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
    pill: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 999 },
  },
  fontPresets: {
    heading: { size: '5xl', weight: 'bold' },
    subheading: { size: '3xl', weight: 'semibold' },
    lead: { size: 'xl', weight: 'medium' },
    body: { size: 'md', weight: 'normal' },
    small: { size: 'sm', weight: 'normal' },
  },
}

function mapSize(sizeToken: any) {
  if (!sizeToken || typeof sizeToken !== 'object') return undefined
  if (typeof sizeToken.size === 'number') return sizeToken.size
  return undefined
}

export const rnStyleFromTokens = (opts: { size?: keyof typeof tokens.textSizes | keyof typeof tokens.fontPresets | null, color?: keyof typeof tokens.colors | null, weight?: keyof typeof tokens.fontWeights | null, lineHeight?: number | null } = {}) => {
  const s: any = {}
  // allow preset or direct size key
  if (opts.size && (opts.size as string) in tokens.fontPresets) {
    const preset = (tokens as any).fontPresets[opts.size as string]
    if (preset && preset.size) {
      const f = tokens.textSizes[preset.size as keyof typeof tokens.textSizes]
      const size = mapSize(f)
      if (typeof size === 'number') s.fontSize = size
    }
    if (preset && preset.weight) {
      const w = tokens.fontWeights[preset.weight as keyof typeof tokens.fontWeights]
      if (w && w.weight) s.fontWeight = w.weight
    }
  } else if (opts.size) {
    const f = tokens.textSizes[opts.size as keyof typeof tokens.textSizes]
    const size = mapSize(f)
    if (typeof size === 'number') s.fontSize = size
  }

  if (opts.weight) {
    const w = tokens.fontWeights[opts.weight]
    if (w && w.weight) s.fontWeight = w.weight
  }
  if (opts.color) {
    const c = tokens.colors[opts.color]
    if (c && c.hex) s.color = c.hex
  }
  if (opts.lineHeight) s.lineHeight = opts.lineHeight
  return StyleSheet.create({ base: s }).base
}

export const rnTokens = tokens

export default rnStyleFromTokens
