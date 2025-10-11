// JSX runtime is automatic; no React import needed
import AnalysisProgress from '@/components/ui/AnalysisProgress'
import PolicyHeader from '@/components/ui/PolicyHeader'
import TabControls from '@/components/ui/TabControls'
import { renderMarkdownToHtml } from '@/lib/policyAnalysisHelpers'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import FreeReportView from '@/components/ui/FreeReportView'
import NoAnalysisView from '@/components/ui/NoAnalysisView'
import FullReportDashboard from '@/components/ui/FullReportDashboard'
import EvidenceList from '@/components/ui/EvidenceList'
import FullReportPrompt from '@/components/ui/FullReportPrompt'
import RevisedPolicyPreview from '@/components/ui/RevisedPolicyPreview'
import { t } from '@/i18n'
import type { ComplianceResult } from '@/types/api'

type Props = {
  activeTab: 'free' | 'full' | 'revised'
  progress: number
  message: string
  isLoadingForTab: boolean
  result: ComplianceResult | null
  reportFilename: string | null
  detailedContent: string | null
  detailedReport: Record<string, unknown> | null
  revisedPolicy: Record<string, unknown> | null
  fullReportSource: Record<string, unknown> | null
  detailedDownloadUrl: string | null
  setLoadingDetailed: (v: boolean) => void
  setLoadingRevised: (v: boolean) => void
  setActiveTab: (tab: 'free' | 'full' | 'revised') => void
  handleGenerateReport: () => Promise<void>
}

export default function PolicyMainPanel({
  activeTab,
  progress,
  message,
  isLoadingForTab,
  result,
  reportFilename,
  detailedContent,
  detailedReport,
  revisedPolicy,
  fullReportSource,
  detailedDownloadUrl,
  setLoadingDetailed,
  setLoadingRevised,
  setActiveTab,
  handleGenerateReport,
}: Props) {
  return (
    <main className="md:col-span-2 bg-white p-4 rounded shadow flex flex-col min-h-0 overflow-hidden">
      <PolicyHeader activeTab={activeTab} result={result} />

      {/* Progress bar and message shown during streaming analysis */}
      {(progress > 0) && (
        <AnalysisProgress message={message} progress={progress} />
      )}

      <TabControls
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setLoadingDetailed={setLoadingDetailed}
        setLoadingRevised={setLoadingRevised}
        reportFilename={reportFilename}
        detailedContent={detailedContent}
      />

      <div className="h-full flex-1 min-h-0 pb-20 md:pb-0">
        {activeTab === 'free' ? (
          isLoadingForTab ? (
            <div className="h-full w-full flex items-center justify-center">
              <LoadingSpinner message={t('policy_analysis.analyzing')} subtext={t('policy_analysis.analyzing')} size="lg" />
            </div>
          ) : result ? (
            <FreeReportView result={result} />
          ) : (
            <NoAnalysisView />
          )
        ) : (
          <div data-view="full" id="report-full-view" className="bg-gray-50 p-4 rounded h-full min-h-0 overflow-auto w-full">
            {isLoadingForTab ? (
              <LoadingSpinner
                message={t('policy_analysis.loading_report')}
                subtext={activeTab === 'revised' ? t('policy_analysis.revised_policy_preview') : t('policy_analysis.loading_report')}
                size="lg"
              />
            ) : (
              activeTab === 'full' ? (
                fullReportSource ? (
                  <div>
                    <FullReportDashboard src={fullReportSource as Record<string, unknown>} />
                    <div className="mt-4">
                      <EvidenceList evidence={(fullReportSource as Record<string, unknown>)['evidence'] as Array<Record<string, unknown>> | null} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <FullReportPrompt onGenerate={handleGenerateReport} disabled={!result} />
                  </div>
                )
              ) : (
                // revised tab: uses saved file content (markdown) or a persisted file (PDF)
                detailedContent ? (
                  <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(detailedContent as string) }} />
                ) : (
                  <RevisedPolicyPreview
                    downloadUrl={detailedDownloadUrl}
                    filename={
                      typeof (detailedReport as Record<string, unknown>)?.filename === 'string'
                        ? (detailedReport as Record<string, unknown>)!.filename as string
                        : typeof (revisedPolicy as Record<string, unknown>)?.filename === 'string'
                          ? (revisedPolicy as Record<string, unknown>)!.filename as string
                          : null
                    }
                  />
                )
              )
            )}
          </div>
        )}
      </div>
    </main>
  )
}
