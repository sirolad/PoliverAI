import { twFromTokens, baseFontSizes, colors } from '@/styles/styleTokens'

type Props = { children?: React.ReactNode }

export default function MetaLine({ children }: Props) {
  if (!children) return null
  return <div className={twFromTokens(baseFontSizes.xs, colors.textMutedLight, 'mt-1')}>{children}</div>
}
