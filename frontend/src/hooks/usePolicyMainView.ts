import { getReportDownloadUrl } from '@/lib/policyHelpers'
import type { ReportDetail } from '@/services/policyService'

export default function usePolicyMainView(opts: {
  activeTab: 'free' | 'full' | 'revised'
  loadingDetailed: boolean
  loadingRevised: boolean
  progress: number
  detailedReport: ReportDetail | null
  revisedPolicy: ReportDetail | null
  reportFilename: string | null
}) {
  const { activeTab, loadingDetailed, loadingRevised, progress, detailedReport, revisedPolicy } = opts

  const isLoadingForTab = activeTab === 'full'
    ? loadingDetailed
    : activeTab === 'revised'
    ? loadingRevised
    : (progress > 0 && progress < 100)

  const fullReportSource = (detailedReport ?? null) as Record<string, unknown> | null

  const detailedDownloadUrl: string | null = (() => {
    const maybe = (activeTab === 'full' ? detailedReport : revisedPolicy) as unknown as Record<string, unknown> | null
    if (!maybe) return null
    if (maybe.download_url && typeof maybe.download_url === 'string') return String(maybe.download_url)
    if (activeTab === 'full' && detailedReport && typeof detailedReport.filename === 'string' && detailedReport.filename) return getReportDownloadUrl(detailedReport.filename)
    if (activeTab === 'revised' && revisedPolicy && typeof revisedPolicy.filename === 'string' && revisedPolicy.filename) return getReportDownloadUrl(revisedPolicy.filename)
    return null
  })()

  return { isLoadingForTab, fullReportSource, detailedDownloadUrl }
}
