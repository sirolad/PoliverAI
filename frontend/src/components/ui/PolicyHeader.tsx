import usePolicyHeader from '@/hooks/usePolicyHeader'
import Text from './Text'
import { twFromTokens, spacing, alignment, textSizes } from '@/styles/styleTokens'

type Props = {
  activeTab: 'free' | 'full' | 'revised'
  result?: import('@/types/api').ComplianceResult | null
}

export default function PolicyHeader({ activeTab, result }: Props) {
  const { headerTitle, headerSubtitle, compactSummary } = usePolicyHeader(activeTab, result)

  return (
    <div className={twFromTokens(spacing.smallTop, alignment.flexRow, alignment.justifyBetween, alignment.itemsCenter)}>
      <div>
        <h2 className={twFromTokens(textSizes.h2, 'font-semibold')}>{headerTitle}</h2>
        <div>{/* subtitle */}<Text preset="small" color="textMuted">{headerSubtitle}</Text></div>
      </div>
      <div><Text preset="small" color="textMuted">{compactSummary}</Text></div>
    </div>
  )
}
