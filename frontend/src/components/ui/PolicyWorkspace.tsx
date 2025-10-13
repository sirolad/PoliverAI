import React from 'react'
import { t } from '@/i18n'
import UploadZone from '@/components/ui/UploadZone'
import SelectedFileInfo from '@/components/ui/SelectedFileInfo'
import { Button } from '@/components/ui/Button'
import { FileText, AlertTriangle } from 'lucide-react'
import SidebarFindingItem from '@/components/ui/SidebarFindingItem'
import SavedReportsCountDisplay from '@/components/ui/SavedReportsCountDisplay'
import PolicyMainPanel from '@/components/ui/PolicyMainPanel'
import usePolicyWorkspace from '@/hooks/usePolicyWorkspace'
import type { ComplianceResult } from '@/types/api'
import { twFromTokens, colors, baseFontSizes, fontWeights } from '@/styles/styleTokens'

type Props = {
  persisted: unknown
  file: File | null
  setFile: (f: File | null) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleAnalyze: () => Promise<void>
  result: ComplianceResult | null
  userReportsCount: number | null
  reportFilename: string | null
  activeTab: 'free' | 'full' | 'revised'
  progress: number
  message: string
  isLoadingForTab: boolean
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

export default function PolicyWorkspace(props: Props) {
  const {
    persisted,
    file,
    setFile,
    fileInputRef,
    handleFileChange,
    handleAnalyze,
    result,
    userReportsCount,
    reportFilename,
    activeTab,
    progress,
    message,
    isLoadingForTab,
    detailedContent,
    detailedReport,
    revisedPolicy,
    fullReportSource,
    detailedDownloadUrl,
    setLoadingDetailed,
    setLoadingRevised,
    setActiveTab,
    handleGenerateReport,
  } = props

  const { showWorkInProgress, findingsCount } = usePolicyWorkspace({ persisted, result, userReportsCount, reportFilename })

  return (
    <div className="flex-1 flex flex-col">
      {showWorkInProgress ? (
        <div className={twFromTokens('mb-2 w-40 px-3 py-1 text-center rounded', colors.warningBg, colors.warning, fontWeights.medium)}>{t('policy_analysis.work_in_progress')}</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <aside className={twFromTokens('md:col-span-1 p-4 rounded shadow', colors.surface)}>
          <UploadZone file={file} setFile={setFile} fileInputRef={fileInputRef} handleFileChange={handleFileChange} />

          {file && (
            <SelectedFileInfo file={file} />
          )}

          <div className="mt-3">
            <Button disabled={!file} onClick={handleAnalyze} className={twFromTokens('w-full px-3 py-2 rounded', colors.primaryBg, colors.ctaText)}>{t('policy_analysis.analyze')}</Button>
          </div>

          <div className="mb-4 mt-4">
            <h3 className={twFromTokens(fontWeights.semibold, 'flex items-center gap-2')}><FileText className={twFromTokens('h-4 w-4', colors.textMuted)} />{t('policy_analysis.summary_heading')}</h3>
            <div className={twFromTokens(baseFontSizes.sm, colors.textSecondary, 'mt-2')}>{result?.summary || t('policy_analysis.no_result_yet')}</div>
          </div>

          <div className="mb-4 mt-4">
            <h3 className={twFromTokens(fontWeights.semibold, 'flex items-center gap-2')}><AlertTriangle className={twFromTokens('h-4 w-4', colors.danger)} />{t('policy_analysis.findings_heading', { count: findingsCount })}</h3>
            <div className={twFromTokens(baseFontSizes.sm, colors.textSecondary, 'mt-2 max-h-40 overflow-auto')}>
              {result?.findings && result.findings.length > 0 ? (
                <div className="space-y-2">
                  {result.findings.map((f: unknown, idx: number) => {
                    const item = f as Record<string, unknown>
                    const article = item.article as string | undefined
                    const issue = item.issue as string | undefined
                    return <SidebarFindingItem key={idx} article={article} issue={issue} />
                  })}
                </div>
              ) : (
                <div className={twFromTokens(baseFontSizes.sm, colors.textMutedLight)}>{t('policy_analysis.no_findings')}</div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h3 className={twFromTokens(fontWeights.semibold)}>{t('policy_analysis.work_in_progress')} {userReportsCount !== null ? `(` : ''}
              {userReportsCount !== null ? (
                <SavedReportsCountDisplay count={userReportsCount} />
              ) : null}
              {userReportsCount !== null ? ` total)` : ''}
            </h3>
            <div className="mt-2">
              {reportFilename ? (
                <div className="space-y-2"><div className={twFromTokens(baseFontSizes.sm)}>{t('policy_analysis.generated_label')} <span className={twFromTokens(fontWeights.medium)}>{reportFilename}</span></div></div>
              ) : (
                <div className={twFromTokens(baseFontSizes.sm, colors.textMutedLight)}>{t('policy_analysis.no_report_generated_yet')}</div>
              )}
            </div>
          </div>
        </aside>

        <PolicyMainPanel
          activeTab={activeTab}
          progress={progress}
          message={message}
          isLoadingForTab={isLoadingForTab}
          result={result}
          reportFilename={reportFilename}
          detailedContent={detailedContent}
          detailedReport={detailedReport}
          revisedPolicy={revisedPolicy}
          fullReportSource={fullReportSource}
          detailedDownloadUrl={detailedDownloadUrl}
          setLoadingDetailed={setLoadingDetailed}
          setLoadingRevised={setLoadingRevised}
          setActiveTab={setActiveTab}
          handleGenerateReport={handleGenerateReport}
        />
      </div>
    </div>
  )
}
