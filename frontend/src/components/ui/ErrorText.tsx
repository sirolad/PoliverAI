import { twFromTokens, baseFontSizes, colors, spacing } from '@/styles/styleTokens'

type Props = { error?: unknown }

export default function ErrorText({ error }: Props) {
  if (!error) return null
  return <p className={twFromTokens(spacing.tinyTop, baseFontSizes.sm, colors.danger)}>{String(error)}</p>
}
