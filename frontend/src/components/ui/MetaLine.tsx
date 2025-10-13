import { twFromTokens, baseFontSizes, colors, spacing } from '@/styles/styleTokens'

type Props = { children?: React.ReactNode }

export default function MetaLine({ children }: Props) {
  if (!children) return null
  return <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight, spacing.tinyTop)}>{children}</div>
}
