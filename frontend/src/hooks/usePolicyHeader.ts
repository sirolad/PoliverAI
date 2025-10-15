import { t } from '@/i18n'
import policyService from '@/services/policyService'
import { resetState as resetPolicyState } from '@/store/policyAnalysisSlice'
import type { Dispatch } from 'redux'
import type { ComplianceResult } from '@/types/api'

type ActionsOpts = {
  dispatch: Dispatch
  setFile: (f: File | null) => void
  setResult: (r: ComplianceResult | null) => void
  setReportFilename: (s: string | null) => void
  setRevisedReportFilename: (s: string | null) => void
  setIsFullReportGenerated: (b: boolean) => void
  setProgress: (n: number) => void
  setMessage: (m: string) => void
  setUserReportsCount: (n: number | null) => void
  setTitleModalInitial: (s: string) => void
  setTitleModalOpen: (b: boolean) => void
  setInstructionsModalOpen: (b: boolean) => void
}

export default function usePolicyHeader(activeTab: 'free' | 'full' | 'revised', result?: ComplianceResult | null, actions?: ActionsOpts) {
  const headerTitle = activeTab === 'free'
    ? t('policy_analysis.title')
    : activeTab === 'full'
    ? t('policy_analysis.title')
    : t('policy_analysis.title')

  const headerSubtitle = t('policy_analysis.header_subtitle')

  const compactSummary = result ? t('policy_analysis.result_summary_compact', { verdict: result.verdict, score: String(result.score) }) : ''

  const resetAll = async () => {
    if (!actions) return
    const { dispatch, setFile, setResult, setReportFilename, setRevisedReportFilename, setIsFullReportGenerated, setProgress, setMessage, setUserReportsCount } = actions
    try { dispatch(resetPolicyState()) } catch (err) { console.warn('failed to reset persisted policy state', err) }
    setFile(null); setResult(null); setReportFilename(null); setRevisedReportFilename(null); setIsFullReportGenerated(false); setProgress(0); setMessage('')
    try {
      const r = await policyService.getUserReports()
      if (Array.isArray(r)) setUserReportsCount(r.length)
      else if (r && typeof r === 'object') {
        const maybe = r as Record<string, unknown>
        const total = typeof maybe.total === 'number' ? maybe.total : (Array.isArray(maybe.reports) ? maybe.reports.length : 0)
        setUserReportsCount(total)
      }
    } catch (err) { console.debug('refresh reports after reset failed', err) }
  }

  const openSaveModal = () => {
    if (!actions) return
    const { setTitleModalInitial, setTitleModalOpen } = actions
    setTitleModalInitial('html')
    setTitleModalOpen(true)
  }

  const openInstructions = () => {
    if (!actions) return
    actions.setInstructionsModalOpen(true)
  }

  return { headerTitle, headerSubtitle, compactSummary, resetAll, openSaveModal, openInstructions }
}
