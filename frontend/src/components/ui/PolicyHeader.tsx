import usePolicyHeader from '@/hooks/usePolicyHeader'
import Text from './Text'

type Props = {
  activeTab: 'free' | 'full' | 'revised'
  result?: import('@/types/api').ComplianceResult | null
}

export default function PolicyHeader({ activeTab, result }: Props) {
  const { headerTitle, headerSubtitle, compactSummary } = usePolicyHeader(activeTab, result)

  return (
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold">{headerTitle}</h2>
        <div>{/* subtitle */}<Text preset="small" color="textMuted">{headerSubtitle}</Text></div>
      </div>
      <div><Text preset="small" color="textMuted">{compactSummary}</Text></div>
    </div>
  )
}
