import { twFromTokens, spacing } from '@/styles/styleTokens'

type IconSpanProps = { children?: React.ReactNode }

export default function IconSpan({ children }: IconSpanProps) {
  if (!children) return null
  // Use centralized tokens for icon spacing and alignment
  return <span className={twFromTokens('btn-icon', spacing.badgeMarginLeft, 'flex-shrink-0')}>{children}</span>
}
