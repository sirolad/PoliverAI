// Ported style tokens for React Native and Nx
// Use with tailwind-react-native-classnames or similar for best results

export const baseFontSizes = {
  xs: { tw: 'text-xs', size: 12 },
  sm: { tw: 'text-sm', size: 14 },
  md: { tw: 'text-base', size: 16 },
  lg: { tw: 'text-lg', size: 18 },
  xl: { tw: 'text-xl', size: 20 },
  '2xl': { tw: 'text-2xl', size: 24 },
  '3xl': { tw: 'text-3xl', size: 30 },
  '5xl': { tw: 'text-5xl', size: 48 },
};

export const textSizes = {
  h1: baseFontSizes['5xl'],
  h2: baseFontSizes['3xl'],
  h3: baseFontSizes['2xl'],
  lead: baseFontSizes.xl,
  lg: baseFontSizes.lg,
  xl: baseFontSizes.xl,
  md: baseFontSizes.md,
  sm: baseFontSizes.sm,
};

export const fontWeights = {
  bold: { tw: 'font-bold', weight: '700' },
  semibold: { tw: 'font-semibold', weight: '600' },
  medium: { tw: 'font-medium', weight: '500' },
  normal: { tw: 'font-normal', weight: '400' },
};

export const palette = {
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
  blue600: '#2563EB',
  blue500: '#3B82F6',
  blue100: '#DBEAFE',
  green600: '#16A34A',
  green100: '#DCFCE7',
  yellow600: '#D97706',
  yellow100: '#FEF3C7',
  red600: '#DC2626',
  red100: '#FEE2E2',
  white: '#FFFFFF',
};

type PaletteKey = keyof typeof palette;
type ColorToken = { tw: string; hex: string };
function makeColor(twClass: string, hexKey: PaletteKey): ColorToken {
  return { tw: twClass, hex: palette[hexKey] };
}

export const colors: Record<string, ColorToken> = {
  textPrimary: makeColor('text-gray-900', 'gray900'),
  textSecondary: makeColor('text-gray-700', 'gray700'),
  textMuted: makeColor('text-gray-600', 'gray600'),
  textMutedLight: makeColor('text-gray-500', 'gray500'),
  textLight: makeColor('text-gray-300', 'gray300'),
  surface: makeColor('bg-white', 'white'),
  surfaceMuted: makeColor('bg-gray-100', 'gray100'),
  pageBg: makeColor('bg-gray-50', 'gray50'),
  surfaceOverlay: makeColor('bg-white/90', 'white'),
  primary: makeColor('text-blue-600', 'blue600'),
  primaryBg: makeColor('bg-blue-600', 'blue600'),
  deepRedBg: makeColor('bg-red-600', 'red600'),
  primaryMuted: makeColor('text-blue-100', 'blue100'),
  primaryBgLight: makeColor('bg-blue-100', 'blue100'),
  success: makeColor('text-green-600', 'green600'),
  successBg: makeColor('bg-green-100', 'green100'),
  greenBg: makeColor('bg-green-600', 'green600'),
  warning: makeColor('text-yellow-600', 'yellow600'),
  warningBg: makeColor('bg-yellow-100', 'yellow100'),
  danger: makeColor('text-red-600', 'red600'),
  dangerBg: makeColor('bg-red-100', 'red100'),
  overlayDark: makeColor('bg-black/50', 'gray900'),
  gradientBlueGreen: makeColor('bg-gradient-to-r from-blue-400 to-green-400', 'blue500'),
  pageGradient: makeColor('bg-gradient-to-b from-blue-50 to-white', 'blue100'),
  mutedBorder: makeColor('border-gray-200', 'gray200'),
  onPrimary: makeColor('text-white', 'white'),
  ctaText: makeColor('text-white', 'white'),
  primaryOnLight: makeColor('text-blue-800', 'blue600'),
  mutedText: makeColor('text-gray-400', 'gray400'),
  primaryBorder: makeColor('border-blue-600', 'blue600'),
  redBorder: makeColor('border-red-100', 'red100'),
  greenBorder: makeColor('border-green-100', 'green100'),
  yellowBorder: makeColor('border-yellow-100', 'yellow100'),
  successBgStrong: makeColor('bg-green-600', 'green600'),
  mutedActionBg: makeColor('bg-gray-700', 'gray700'),
  warningBgStrong: makeColor('bg-yellow-600', 'yellow600'),
};

export type SpacingToken = { tw: string; value: number | null };
export const spacing: Record<string, SpacingToken> = {
  sectionPaddingY: { tw: 'py-16', value: 64 },
  card: { tw: 'p-4', value: 16 },
  formRow: { tw: 'mb-4', value: 16 },
  blockSmall: { tw: 'mb-2', value: 8 },
  cardInnerGap: { tw: 'gap-4', value: 16 },
  controlsGap: { tw: 'gap-3', value: 12 },
  badgeMarginLeft: { tw: 'ml-2', value: 8 },
  badgeMarginRight: { tw: 'mr-2', value: 8 },
  smallTop: { tw: 'mt-2', value: 8 },
  headingMargin: { tw: 'mb-4', value: 16 },
  iconsMd: { tw: 'h-6 w-6', value: 24 },
  iconsXs: { tw: 'h-4 w-4', value: 16 },
  iconsSm: { tw: 'h-8 w-8', value: 32 },
  iconsMdLarge: { tw: 'h-10 w-10', value: 40 },
  iconWrapper: { tw: 'flex-shrink-0 rounded-md flex items-center justify-center', value: null },
  iconWrapperCompact: { tw: 'flex-shrink-0 rounded-md flex items-center justify-center p-2', value: null },
  iconWrapperLarge: { tw: 'flex-shrink-0 rounded-md flex items-center justify-center p-3', value: null },
  headingLarge: { tw: 'mb-6', value: 24 },
  sectionTitle: { tw: 'text-center mb-12', value: null },
  sectionBlock: { tw: 'my-4', value: null },
  sectionButtonTop: { tw: 'mt-6', value: 24 },
  buttonSmall: { tw: 'px-3 py-1 rounded', value: null },
  cardCompact: { tw: 'p-2', value: 8 },
  cardDefault: { tw: 'p-3', value: 12 },
  cardLg: { tw: 'p-10', value: 40 },
  pillBtn: { tw: 'px-4 py-2 rounded-full', value: null },
  tabBtn: { tw: 'px-3 py-1 border', value: null },
  fullScreenCenter: { tw: 'min-h-screen flex items-center justify-center', value: null },
  menuButton: { tw: 'p-2 rounded-md border shadow-sm focus:outline-none', value: null },
  menuContainer: { tw: 'absolute right-0 mt-2 w-56 rounded shadow py-1 z-[9999]', value: null },
  menuHeaderPadding: { tw: 'px-4 py-3', value: null },
  menuItem: { tw: 'px-4 py-2', value: null },
  containerMaxMd: { tw: 'max-w-md w-full', value: null },
  containerMaxLg: { tw: 'max-w-4xl mx-auto', value: null },
  gridGapLarge: { tw: 'gap-6', value: 24 },
  headingOffset: { tw: 'mr-4', value: 16 },
  tinyTop: { tw: 'mt-1', value: 4 },
  tinyBottom: { tw: 'mb-1', value: 4 },
  mt3: { tw: 'mt-3', value: 12 },
  fullWidthLeft: { tw: 'w-full text-left', value: null },
  navLink: { tw: 'px-3 py-2', value: null },
  navLinksContainer: { tw: 'flex items-center gap-4', value: null },
  brandGap: { tw: 'flex items-center gap-2 font-bold', value: null },
  iconsLg: { tw: 'h-12', value: 48 },
  emptyOuterLg: { tw: 'w-40 h-40', value: null },
  emptyOuterMd: { tw: 'w-24 h-24', value: null },
  emptyOuterMd2: { tw: 'w-28 h-28', value: null },
  emptyIconLg: { tw: 'h-20 w-20', value: null },
  emptyIconMd: { tw: 'h-12 w-12', value: null },
  navbarContainer: { tw: 'container mx-auto px-4 h-16', value: null },
  navbarBg: { tw: 'border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60', value: null },
  progressTop: { tw: 'mt-4', value: 16 },
  progressBarContainer: { tw: 'h-2 w-full rounded-full overflow-hidden', value: null },
  progressBarInner: { tw: 'h-2 rounded-full', value: null },
};

export type ButtonToken = { tw: string; value: number | null };
export const buttons: Record<string, ButtonToken> = {
  base: { tw: 'px-4 py-2 rounded', value: null },
  small: { tw: 'px-3 py-1 rounded text-sm', value: null },
  pill: { tw: 'px-4 py-2 rounded-full', value: null },
};

import tw from 'twrnc';
export function twFromTokens(...items: Array<string | { tw?: string } | undefined | null>): any {
  const parts: string[] = [];
  items.forEach((it) => {
    if (!it) return;
    if (typeof it === 'string') parts.push(it);
    else if (typeof it === 'object' && it.tw) parts.push(it.tw);
  });
  return tw.style(parts.join(' ').trim());
}

export type RNStyleOpts = {
  size?: keyof typeof textSizes;
  color?: keyof typeof colors;
  weight?: keyof typeof fontWeights;
  lineHeight?: number;
};
export function rnStyleFromTokens(opts: RNStyleOpts): Partial<{ fontSize: number; color: string; fontWeight: string; lineHeight: number }> {
  const style: Partial<{ fontSize: number; color: string; fontWeight: string; lineHeight: number }> = {};
  if (opts.size) {
    const s = textSizes[opts.size];
    if (s && typeof s.size === 'number') style.fontSize = s.size;
  }
  if (opts.color) {
    const c = colors[opts.color];
    if (c && typeof c.hex === 'string') style.color = c.hex;
  }
  if (opts.weight) {
    const w = fontWeights[opts.weight];
    if (w && w.weight) style.fontWeight = w.weight;
  }
  if (opts.lineHeight) style.lineHeight = opts.lineHeight;
  return style;
}
