import usePolicyHeader from '@/hooks/usePolicyHeader'

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
        <div className="text-sm text-gray-600">{headerSubtitle}</div>
      </div>
      <div className="text-sm text-gray-600">{compactSummary}</div>
    </div>
  )
}
