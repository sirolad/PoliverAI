import React, { useEffect, useState, useRef } from 'react'
import policyService, { type ReportDetail } from '@/services/policyService'
import { t } from '@/i18n'
import EnterTitleModal from './ui/EnterTitleModal'
import ReportViewerModal from './ui/ReportViewerModal'
import EnterInstructionsModal from './ui/EnterInstructionsModal'
import useAuth from '@/contexts/useAuth'
import type { ComplianceResult } from '@/types/api'
import { RefreshCcw, Save, FileCheck, Bot } from 'lucide-react'
import { htmlNodeToHtmlAndCss } from '@/lib/policyAnalysisHelpers'
import { Button } from '@/components/ui/Button'
import usePaymentResult from '@/components/ui/PaymentResultHook'
// moved into PolicyMainPanel
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import NoDataView from '@/components/ui/NoDataView'
import PolicyWorkspace from '@/components/ui/PolicyWorkspace'
// ReportCard intentionally not used here — full report uses custom layout
// EvidenceItem unused in this view (detailed report uses markdown/content or simple blocks)
import InsufficientCreditsModal from './ui/InsufficientCreditsModal'
import { getReportDownloadUrl } from '@/lib/policyHelpers'
// moved into PolicyWorkspace
import { safeDispatch, safeDispatchMultiple } from '@/lib/eventHelpers'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setState as setPolicyState, resetState as resetPolicyState } from '@/store/policyAnalysisSlice'
import type { RootState } from '@/store/store'
// BrandBlock now used inside FreeReportView

// Local helper types removed (not used here). The detailed report shape is `ReportDetail` imported from policyService.

export default function PolicyAnalysis() {
  const { isAuthenticated, loading, refreshUser } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [message, setMessage] = useState<string>('')
  const [result, setResult] = useState<ComplianceResult | null>(null)
  const [reportFilename, setReportFilename] = useState<string | null>(null)
  const [revisedReportFilename, setRevisedReportFilename] = useState<string | null>(null)
  const [isFullReportGenerated, setIsFullReportGenerated] = useState<boolean>(false)
  const [userReportsCount, setUserReportsCount] = useState<number | null>(null)
  // progress bar visibility is derived from `progress` value
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // tabs
  const [activeTab, setActiveTab] = useState<'free' | 'full' | 'revised'>('free')
  const [detailedContent, setDetailedContent] = useState<string | null>(null)
  const [detailedReport, setDetailedReport] = useState<ReportDetail | null>(null)
  const [revisedPolicy, setRevisedPolicy] = useState<ReportDetail | null>(null)
  const [loadingDetailed, setLoadingDetailed] = useState<boolean>(false)
  // Separate loading state for revised reports so the "full report" loader
  // does not show when a revised policy is being generated/loaded.
  const [loadingRevised, setLoadingRevised] = useState<boolean>(false)

  const [titleModalOpen, setTitleModalOpen] = useState(false)
  const [titleModalInitial, setTitleModalInitial] = useState<string>('')
  const [viewerOpen, setViewerOpen] = useState<boolean>(false)
  const [viewerUrl ] = useState<string | null>(null)
  const [viewerFilename, setViewerFilename] = useState<string | null>(null)
  const [viewerTitle ] = useState<string | null>(null)
  const [viewerIsQuick ] = useState<boolean | undefined>(undefined)
  const [insufficientOpen, setInsufficientOpen] = useState(false)
  const [instructionsModalOpen, setInstructionsModalOpen] = useState(false)
  const [instructionsInitial] = useState<string>('')

  const saveProgressIntervalRef = useRef<number | null>(null)
  const analysisFinishedRef = useRef<boolean>(false)
  const dispatch = useAppDispatch()
  const persisted = useAppSelector((s: RootState) => s.policyAnalysis)

  // Payment/result UI hook (used to show quick success/error feedback)
  const paymentResult = usePaymentResult()

  // hydrate persisted UI
  const hydratedRef = useRef(false)
  // hydrate persisted UI
  useEffect(() => {
    // Only hydrate once on initial mount to avoid overwriting live progress/state
    if (hydratedRef.current) return
    if (persisted && persisted.fileName) {
      if (typeof persisted.progress === 'number') setProgress(persisted.progress)
      if (persisted.message) setMessage(persisted.message)
      if (persisted.result) setResult(persisted.result)
      if (persisted.reportFilename) setReportFilename(persisted.reportFilename)
      if (persisted.revisedReportFilename) setRevisedReportFilename(persisted.revisedReportFilename)
      if (typeof persisted.isFullReportGenerated === 'boolean') setIsFullReportGenerated(persisted.isFullReportGenerated)
      // hydrate newly-persisted fields so Full/Revised tabs restore
      if (persisted.detailedReport) setDetailedReport(persisted.detailedReport as unknown as ReportDetail)
      if (persisted.revisedPolicy) setRevisedPolicy(persisted.revisedPolicy as unknown as ReportDetail)
      if (persisted.activeTab) setActiveTab(persisted.activeTab)
      if (typeof persisted.loadingDetailed === 'boolean') setLoadingDetailed(persisted.loadingDetailed)
      if (typeof persisted.loadingRevised === 'boolean') setLoadingRevised(persisted.loadingRevised)
    }
    // mark hydration complete so the persist effect doesn't immediately write back
    hydratedRef.current = true
  }, [persisted])

  // persist UI (but skip initial hydration to avoid write loop)
  useEffect(() => {
    if (!hydratedRef.current) return
    dispatch(
      setPolicyState({
        fileName: file ? file.name : null,
        progress,
        message,
        result,
        reportFilename,
        revisedReportFilename,
        isFullReportGenerated,
        // persist additional UI context so users return to same view
        detailedContent,
        detailedReport,
        revisedPolicy,
        activeTab,
        loadingDetailed,
        loadingRevised,
      })
    )
  }, [file, progress, message, result, reportFilename, revisedReportFilename, isFullReportGenerated, detailedContent, detailedReport, revisedPolicy, activeTab, loadingDetailed, loadingRevised, dispatch])

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => {/* progress settled */}, 800)
      return () => clearTimeout(t)
    }
    return undefined
  }, [progress])

  useEffect(() => {
    if (!isAuthenticated) return
    let mounted = true
    policyService
      .getUserReportsCount()
      .then((n) => {
        if (mounted) setUserReportsCount(n ?? 0)
      })
      .catch((err) => console.debug('getUserReportsCount failed', err))
    return () => {
      mounted = false
    }
  }, [isAuthenticated])

  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail || {}
        const path = detail.path || detail.filename || null
        if (path) {
          const filename = typeof path === 'string' ? path.split('/').pop() as string : String(path)
          setReportFilename(filename)
          setActiveTab('full')
          policyService.getUserReportsCount().then((n) => setUserReportsCount(n ?? 0)).catch(() => {})
        }
      } catch (err) {
        console.warn('report:generated handler error', err)
  }
      // Mark that a full report has been generated (persisted or inline)
      // This enables the Revised Policy button to appear so the user can
      // request a revision. Note: we do NOT auto-save the full report here;
      // saving still requires an explicit user action.
      setIsFullReportGenerated(true)
    }
    window.addEventListener('report:generated', handler as EventListener)
    return () => window.removeEventListener('report:generated', handler as EventListener)
  }, [])

  // Hide any global mobile bottom action bar on small viewports so the
  // top controls remain visible and the fixed bottom bar doesn't overlap
  // the page. This is defensive — the bottom bar can be rendered by a
  // shared layout; hide it here only on mobile sizes (Tailwind `md` ≈ 768px).
  useEffect(() => {
    const apply = () => {
      try {
        if (typeof window === 'undefined' || typeof document === 'undefined') return
        const isMobile = window.innerWidth <= 768
        // Look for any element that is positioned `fixed` and anchored to
        // bottom-left-right. We can't rely on exact class ordering, so query
        // all `.fixed` elements and filter by positional classes.
        const fixedNodes = Array.from(document.querySelectorAll('.fixed')) as HTMLElement[]
        fixedNodes.forEach((el) => {
          if (!el || !el.classList) return
          const className = String(el.className || '')
          const hasBottom = el.classList.contains('bottom-0') || className.includes('bottom-0')
          const hasLeft = el.classList.contains('left-0') || className.includes('left-0')
          const hasRight = el.classList.contains('right-0') || className.includes('right-0')
          if (hasBottom && hasLeft && hasRight) {
            if (isMobile) {
              // save previous inline display so we can restore it later
              if (!el.dataset.poliverPrevDisplay) el.dataset.poliverPrevDisplay = el.style.display || ''
              el.style.display = 'none'
            } else {
              if (el.dataset.poliverPrevDisplay !== undefined) {
                el.style.display = el.dataset.poliverPrevDisplay || ''
                delete el.dataset.poliverPrevDisplay
              } else {
                el.style.display = ''
              }
            }
          }
        })
      } catch (err) {
        console.debug('hideMobileBottomBar failed', err)
      }
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])

  // Determine whether the current tab is in a loading state. We keep
  // separate flags for full vs revised so their UIs can be distinct.
  // For the free tab treat an in-progress streaming analysis (progress between
  // 0 and 100) as a loading state so we can render the LoadingSpinner there
  // as well.
  const isLoadingForTab = activeTab === 'full'
    ? loadingDetailed
    : activeTab === 'revised'
    ? loadingRevised
    : (progress > 0 && progress < 100)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner message={t('loading.short')} size="lg" />
    </div>
  )
  
  if (!isAuthenticated) return <NoDataView title={t('policy_analysis.not_authenticated_title')} message={t('policy_analysis.not_authenticated_message')} iconSize="lg" iconType='locked' />

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0])
  }

  const startIndeterminateProgress = (startMessage = t('policy_analysis.analyzing')) => {
  /* progress UI shown via progress value */
    setMessage(startMessage)
    setProgress(5)
    if (saveProgressIntervalRef.current) {
      window.clearInterval(saveProgressIntervalRef.current)
      saveProgressIntervalRef.current = null
    }
    saveProgressIntervalRef.current = window.setInterval(() => {
      setProgress((cur) => {
        const inc = cur < 50 ? Math.floor(Math.random() * 6) + 5 : Math.floor(Math.random() * 3) + 1
        return Math.min(90, cur + inc)
      })
    }, 300)
    return () => {
      if (saveProgressIntervalRef.current) {
        window.clearInterval(saveProgressIntervalRef.current)
        saveProgressIntervalRef.current = null
      }
    }
  }

  const handleAnalyze = async () => {
    setActiveTab('free')
    if (!file) return
    // mark as in-progress
    analysisFinishedRef.current = false

    // show quick/free analysis and clear any loaded detailed report
    setDetailedReport(null)
    setRevisedPolicy(null)
    setDetailedContent(null)
    setProgress(0)
    setMessage(t('policy_analysis.analyzing'))
    setMessage(t('policy_analysis.analyzing'))
    const stop = startIndeterminateProgress(t('policy_analysis.analyzing'))
    // progress shown by progress value
    try {
      setIsFullReportGenerated(false)
      const res = await policyService.analyzePolicyStreaming(file, 'fast', (progressVal, msg) => {
        // Ignore any late/straggler callbacks after we've marked the run finished
        if (analysisFinishedRef.current) return
        setProgress(progressVal ?? 0)
        setMessage(msg ?? '')
      })
      setResult(res)
      setMessage(t('policy_analysis.loaded'))
      setMessage(t('policy_analysis.loaded'))
      setMessage(t('policy_analysis.generate_failed'))
      setProgress(100)
      // stop the indeterminate progress updater immediately so it cannot
      // later overwrite the final 100% with a value capped at 90.
      try { if (typeof stop === 'function') stop() } catch (err) { console.debug('stop() failed', err) }
      // mark finished so further streaming updates are ignored
      analysisFinishedRef.current = true
      // ensure Full tab is visible after a completed quick analysis so the user
      // can immediately click "Full Report" to persist or view the detailed report.
      try { await refreshUser() } catch (e) { console.warn('Failed to refresh user after analysis', e) }
      try { safeDispatchMultiple([{ name: 'payment:refresh-user' }, { name: 'transactions:refresh' }]) } catch (err) { console.debug('safeDispatchMultiple failed', err) }
      setTimeout(() => {/* progress settled */}, 700)
    } catch (err: unknown) {
      // mark finished on error too so we stop accepting callbacks
      analysisFinishedRef.current = true
      try { if (typeof stop === 'function') stop() } catch (err) { console.debug('stop() failed', err) }
      if (err instanceof Error) setMessage(err.message)
      else if (typeof err === 'string') setMessage(err)
      else setMessage(t('policy_analysis.generate_failed'))
      setTimeout(() => {/* progress settled */}, 700)
    } finally {
      if (typeof stop === 'function') stop()
      // defensive: ensure finished flag set in finally as well
      analysisFinishedRef.current = true
      setTimeout(() => {/* progress settled */}, 700)
    }
  }

  const handleGenerateReport = async () => {
    setActiveTab('full')
    if (!result) return
    const stop = startIndeterminateProgress(t('policy_analysis.generating_full_report'))

    try {
      const documentName = file?.name ?? (persisted?.fileName as string | undefined) ?? 'policy'
      const resp = await policyService.generateVerificationReport(result, documentName, 'balanced')
      // The backend may return either a persisted filename (and download_url)
      // or an inline detailed report JSON (findings/recommendations/etc.).
      // Handle both: if we get inline details, render them immediately; if we
      // get a filename, fetch the persisted detailed report for the Full tab.
      try {
        const maybe = resp as unknown as Record<string, unknown>
        const looksLikeDetail = maybe && (Array.isArray(maybe['findings']) || typeof maybe['verdict'] === 'string' || typeof maybe['content'] === 'string')
        if (looksLikeDetail) {
          // Inline detailed report returned directly from generation — render it
          const detail = resp as unknown as ReportDetail
          setDetailedReport(detail)
          setDetailedContent(detail.content ?? null)
          if (detail.filename) setReportFilename(detail.filename)
          // Mark that a full report has been generated (persisted or inline).
          // This enables the Revised Policy button to appear so the user can
          // request a revision. Note: we do NOT auto-save the full report here;
          // saving still requires an explicit user action.
          setIsFullReportGenerated(true)
        } else if (maybe && typeof maybe['filename'] === 'string') {
          // Persisted filename returned — set it and attempt to load detailed data
          const fn = String(maybe['filename'])
          setReportFilename(fn)
          // Persisted filename implies generation succeeded and the full report
          // is now available — allow revisions to be requested.
          setIsFullReportGenerated(true)
          try { await loadDetailed(fn, 'full') } catch (err) { console.debug('loadDetailed after generate failed', err) }
        }
      } catch (err) {
        console.debug('inspect generateVerificationReport response failed', err)
      }
      setMessage(t('policy_analysis.full_report_generated'))
      setProgress(100)
      // stop the indeterminate progress updater immediately so it cannot
      // later overwrite the final 100% with a value capped at 90.
      try { if (typeof stop === 'function') stop() } catch (err) { console.debug('stop() failed', err) }
      // mark finished so further interval/streaming updates are ignored
      analysisFinishedRef.current = true
      try { const n = await policyService.getUserReportsCount(); setUserReportsCount(n ?? 0) } catch (err) { console.debug('getUserReportsCount failed', err) }
      try { await refreshUser() } catch (err) { console.debug('refreshUser failed', err) }
      try { safeDispatchMultiple([{ name: 'payment:refresh-user' }, { name: 'transactions:refresh' }]) } catch (err) { console.debug('safeDispatchMultiple failed', err) }
    } catch (e: unknown) {
      // if payment required
      try {
        const maybe = e as unknown as Record<string, unknown>
        if (maybe && 'status' in maybe) {
          const st = (maybe as unknown as Record<string, unknown>)['status']
          if (typeof st === 'number' && st === 402) setInsufficientOpen(true)
        }
      } catch (err) { console.debug('inspect error status failed', err) }
      setMessage(e instanceof Error ? e.message : t('policy_analysis.generate_failed'))
    } finally {
      try { stop() } catch (err) { console.debug('stop() failed', err) }
      setTimeout(() => {/* progress settled */}, 700)
    }
  }

  const handleGenerateRevision = async (instructions?: string) => {
    setActiveTab('revised')
    if (!result) return
    const stop = startIndeterminateProgress(t('policy_analysis.analyzing'))

    try {
      const original = (file ? await file.text() : '') || ''
      const resp = await policyService.generatePolicyRevision(
        original,
        (result.findings || []) as unknown as Record<string, unknown>[],
        (result.recommendations || []) as unknown as Record<string, unknown>[],
        (result.evidence || []) as unknown as Record<string, unknown>[],
        file?.name ?? (persisted?.fileName as string | undefined) ?? 'policy',
        'comprehensive'
        , instructions
      )
      if (resp?.filename) {
        setRevisedReportFilename(resp.filename)
        setMessage(t('policy_analysis.revised_policy_generated'))
        setProgress(100)
        try { if (typeof stop === 'function') stop() } catch (err) { console.debug('stop() failed', err) }
        analysisFinishedRef.current = true
        try { const n = await policyService.getUserReportsCount(); setUserReportsCount(n ?? 0) } catch (err) { console.debug('getUserReportsCount failed', err) }
        try { await refreshUser() } catch (err) { console.debug('refreshUser failed', err) }
        try { safeDispatchMultiple([{ name: 'transactions:refresh' }, { name: 'payment:refresh-user' }, { name: 'reports:refresh' }]) } catch (err) { console.debug('safeDispatchMultiple failed', err) }
        // load the revised report into the revised tab so the user can view it
        try { 
          await loadDetailed(resp.filename, 'revised') 
          setActiveTab('revised')
        } catch (err) { console.debug('loadDetailed revised failed', err) }
      }
    } catch (e: unknown) {
      try {
        const maybe = e as unknown as Record<string, unknown>
        if (maybe && 'status' in maybe && maybe.status === 402) setInsufficientOpen(true)
      } catch (err) { console.debug('inspect revision error failed', err) }
      setMessage(e instanceof Error ? e.message : t('policy_analysis.revision_failed'))
    } finally {
      stop()
      setTimeout(() => {/* progress settled */}, 700)
    }
  }

  const loadDetailed = async (filename?: string, mode: 'full' | 'revised' = 'full') => {
    console.log('loadDetailed()', { filename, mode })
    // For 'full' mode filename is optional (we may render from streaming `result`).
    // For 'revised' mode we need a saved filename (revisedReportFilename or reportFilename).
    const fn = filename ?? (mode === 'revised' ? (revisedReportFilename ?? reportFilename) : reportFilename)
    if (mode === 'revised' && !fn) return
    if (mode === 'full') setLoadingDetailed(true)
    else setLoadingRevised(true)
    try {
      if(!fn) throw new Error(t('policy_analysis.failed_to_load_report'))
      const resp = await policyService.getDetailedReport(fn)
      if(mode === 'revised') setRevisedPolicy(resp ?? null)
      else if(mode === 'full') setDetailedReport(resp ?? null)
      if(mode === 'revised') setDetailedContent(resp?.content ?? null)
      // When detailed content is available, ensure the progress UI reflects completion
      setMessage(t('policy_analysis.loaded'))
      setMessage(t('policy_analysis.loaded'))
      setProgress(100)
    } catch (e) {
      console.warn('getDetailedReport failed', e)
      if(mode === 'revised') setRevisedPolicy(null)
      else if(mode === 'full') setDetailedReport(null)
      // on failure, reset progress/message so UI doesn't hang at an in-between state
      setMessage(t('policy_analysis.failed_to_load_report'))
      setMessage(t('policy_analysis.failed_to_load_report'))
      setProgress(0)
    } finally {
      if (mode === 'full') setLoadingDetailed(false)
      else setLoadingRevised(false)
    }
  }

  // Top-level handlers extracted from inline props to keep JSX concise
  const handleResetAll = async () => {
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

  const handleSaveConfirm = async (title?: string, saveType?: string) => {
    // If we have an existing persisted filename, use the normal save flow.
    // Otherwise persist inline content (prefer detailedContent then streaming result)
    try {
      const documentName = title ?? file?.name ?? persisted?.fileName
      try {
        const typedSaveType: 'html' | 'regular' = saveType === 'html' ? 'html' : 'regular'
        if (typedSaveType === 'html') {
          const isFree = activeTab === 'free'
          const isFull = activeTab === 'full'
          const selector = isFree ? '[data-view="free"]' : isFull ? '[data-view="full"]' : '[data-view="revised"]'
          let node = document.querySelector(selector) as HTMLElement | null
          if (!node) node = document.querySelector('main') as HTMLElement | null
          const { htmlDocument } = htmlNodeToHtmlAndCss(node, {
            title: documentName || 'Compliance Report',
            includeGlobalCss: true,
            inlineComputed: true,
          })
          const isQuick = activeTab === 'free' || !isFullReportGenerated
          const resp = await policyService.saveReportInline(
            htmlDocument,
            undefined,
            documentName ?? undefined,
            { is_quick: isQuick, save_type: 'html' }
          )
          try { paymentResult.show('success', 'Report Saved', `Saved as ${resp.filename}`) } catch (e) { console.warn('paymentResult.show failed', e); }
          if (resp?.filename) {
            setReportFilename(resp.filename)
            try { paymentResult.show('success', 'Report Saved', `Saved as ${resp.filename}`) } catch (e) { console.warn('failed to show save success', e) }
          }
        } else {
          console.log('saving inline report as text/markdown')
          let content = detailedContent ?? null
          if (!content && result) {
            const sb: string[] = []
            sb.push(`# Compliance Report\n`)
            sb.push(`**Verdict:** ${result.verdict}\n`)
            sb.push(t('policy_analysis.markdown_score', { score: String(result.score) }))
            sb.push(t('policy_analysis.markdown_confidence', { pct: String(Math.round(result.confidence * 100)) }))
            sb.push(`## Summary\n${result.summary}\n\n`)
            if (result.findings && result.findings.length > 0) {
              sb.push('## Findings\n')
              result.findings.forEach((f) => {
                sb.push(`- Article ${f.article}: ${f.issue} (confidence ${(f.confidence*100).toFixed(0)}%)`)
              })
              sb.push('\n')
            }
            content = sb.join('\n')
          }
          const resp = await policyService.saveReportInline(content ?? '', undefined, documentName ?? undefined, { is_quick: !isFullReportGenerated, save_type: typedSaveType })
          try { paymentResult.show('success', 'Report Saved', `Saved as ${resp.filename}`) } catch (e) { console.warn('failed to show save success', e) }
        }
      } catch (err) {
        console.warn('save inline failed', err)
        try { paymentResult.show('failed', 'Save Failed', String(err)) } catch (e) { console.warn('failed to show save error', e) }
      }
    } catch (e) {
      console.warn('save from title modal failed', e)
    }
    setTitleModalOpen(false)
    try { safeDispatch('transactions:refresh') } catch (err) { console.debug('safeDispatch failed', err) }
  }

  const handleInstructionsConfirm = async (instructions?: string) => {
    try {
      await handleGenerateRevision(instructions || undefined)
      setActiveTab('revised')
    } catch (err) {
      console.debug('generate revision failed', err)
    }
  }

  // helpers moved to lib/policyAnalysisHelpers

  // When rendering the Full dashboard prefer the structured JSON payload
  // coming only from a fetched `detailedReport`. We intentionally do not
  // fall back to the streaming `result` here so the Full tab only shows
  // confirmed/persisted full reports.
  const fullReportSource = (detailedReport ?? null) as (Record<string, unknown> | null)

  // If we have a detailedReport record that doesn't include textual
  // content (e.g., a PDF), the backend may provide a `download_url`. Build
  // a stable download URL to embed or open in the UI.
  const detailedDownloadUrl: string | null = (() => {
    if (!detailedReport || !revisedPolicy) return null
    // prefer explicit download_url field if present. Use unknown->Record check
    // to avoid casting to `any` which the linter flags.
    const maybe = (activeTab === 'full' ? detailedReport : revisedPolicy) as unknown as Record<string, unknown>
    if (maybe.download_url && typeof maybe.download_url === 'string') return String(maybe.download_url)
    if (typeof detailedReport.filename === 'string' && detailedReport.filename && activeTab === 'full') return getReportDownloadUrl(detailedReport.filename)
    if (typeof revisedPolicy.filename === 'string' && revisedPolicy.filename && activeTab === 'revised') return getReportDownloadUrl(revisedPolicy.filename)
    return null
  })()

  // (RevisedPolicyPreview will receive `detailedDownloadUrl` directly)

  // header handled by usePolicyHeader/PolicyHeader component

  return (
    <div className="p-8 flex flex-col min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{t('policy_analysis.title')}</h1>

        {(result || reportFilename) ? (
          <div className="flex items-center gap-2">
            {/* Download button removed per UX update */}

                <Button
                  onClick={handleResetAll}
                  className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                  icon={<RefreshCcw className="h-4 w-4" />}
                  iconColor="text-white"
                  collapseToIcon
                >
                  {t('policy_analysis.reset')}
                </Button>

            <Button disabled={!result} onClick={handleGenerateReport} className="px-3 py-1 bg-black text-white rounded disabled:opacity-50" icon={<FileCheck className="h-4 w-4" />} iconColor="text-white" collapseToIcon>{t('policy_analysis.full_report_cta')}</Button>

            <Button disabled={!result} onClick={() => { const initial = 'html'; setTitleModalInitial(initial); setTitleModalOpen(true) }} className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50" icon={<Save className="h-4 w-4" />} iconColor="text-white" collapseToIcon>{t('policy_analysis.save')}</Button>

            {isFullReportGenerated && (
              <Button disabled={!isFullReportGenerated || !result} onClick={() => setInstructionsModalOpen(true)} className="px-3 py-1 bg-purple-600 text-white rounded disabled:opacity-50" icon={<Bot className="h-4 w-4" />} iconColor="text-white" collapseToIcon>{t('policy_analysis.revised_policy_cta')}</Button>
            )}
          </div>
        ) : null}
      </div>

      <InsufficientCreditsModal open={insufficientOpen} onClose={() => setInsufficientOpen(false)} />

      <div className="flex-1 flex flex-col">
        {persisted && persisted.fileName ? (
          <div className="mb-2 w-40 px-3 py-1 text-center rounded bg-yellow-100 text-yellow-500 font-medium">{t('policy_analysis.work_in_progress')}</div>
        ) : null}

        <PolicyWorkspace
          persisted={persisted}
          file={file}
          setFile={setFile}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          handleAnalyze={handleAnalyze}
          result={result}
          userReportsCount={userReportsCount}
          reportFilename={reportFilename}
          activeTab={activeTab}
          progress={progress}
          message={message}
          isLoadingForTab={isLoadingForTab}
          detailedContent={detailedContent}
          detailedReport={detailedReport as unknown as Record<string, unknown> | null}
          revisedPolicy={revisedPolicy as unknown as Record<string, unknown> | null}
          fullReportSource={fullReportSource}
          detailedDownloadUrl={detailedDownloadUrl}
          setLoadingDetailed={setLoadingDetailed}
          setLoadingRevised={setLoadingRevised}
          setActiveTab={setActiveTab}
          handleGenerateReport={handleGenerateReport}
        />
      </div>

      {titleModalOpen && (
        <EnterTitleModal
          open={titleModalOpen}
          initial={titleModalInitial}
          onClose={() => setTitleModalOpen(false)}
          onConfirm={handleSaveConfirm}
          
        />
      )}

      {viewerOpen && (
        <ReportViewerModal
          reportUrl={viewerUrl || ''}
          filename={viewerFilename}
          inlineContent={detailedContent}
          title={(viewerTitle ?? viewerFilename) ?? undefined}
          isQuick={viewerIsQuick}
          onClose={() => setViewerOpen(false)}
          onSaved={(fn) => { setReportFilename(fn); setViewerFilename(fn) }}
          onDeleted={(fn) => { setViewerOpen(false); if (fn === reportFilename) setReportFilename(null) }}
        />
      )}
      
      {instructionsModalOpen && (
        <EnterInstructionsModal
          open={instructionsModalOpen}
          initial={instructionsInitial}
          onClose={() => setInstructionsModalOpen(false)}
          onConfirm={handleInstructionsConfirm}
        />
      )}

      {/* Mobile action bar intentionally hidden — use top controls instead */}
      <div className="hidden" aria-hidden="true" />
    </div>
  )
}

// Small helper component: animate a single numeric count using the shared hook.
// SavedReportsCountDisplay moved to `components/ui/SavedReportsCountDisplay.tsx`
