<<<<<<< HEAD
import React, { useEffect, useState, useRef } from 'react'
import policyService, { type ReportDetail } from '@/services/policyService'
import { t } from '@/i18n'
import EnterTitleModal from './ui/EnterTitleModal'
import ReportViewerModal from './ui/ReportViewerModal'
import EnterInstructionsModal from './ui/EnterInstructionsModal'
import useAuth from '@/contexts/useAuth'
import type { ComplianceResult } from '@/types/api'
import { RefreshCcw, Save, FileCheck, Bot } from 'lucide-react'
import { twFromTokens, textSizes, fontWeights, colors, alignment } from '@/styles/styleTokens'
import { htmlNodeToHtmlAndCss } from '@/lib/policyAnalysisHelpers'
import { Button } from '@/components/ui/Button'
import { buttons } from '@/styles/styleTokens'
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
  const [progress, setProgress] = useState<number>(0)
  const [message, setMessage] = useState<string>('')
  const [result, setResult] = useState<ComplianceResult | null>(null)
  const [reportFilename, setReportFilename] = useState<string | null>(null)
  const [revisedReportFilename, setRevisedReportFilename] = useState<string | null>(null)
  const [isFullReportGenerated, setIsFullReportGenerated] = useState<boolean>(false)
  const [userReportsCount, setUserReportsCount] = useState<number | null>(null)
  // progress bar visibility is derived from `progress` value
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [instructionsInitial, setInstructionsInitial] = useState<string>('')
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
    <div className={twFromTokens('min-h-screen', alignment.center)}>
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

  // Load detailed report (full or revised). Hoisted so handlers can call it.
  async function loadDetailed(filename?: string | null, mode: 'full' | 'revised' = 'full') {
    const fn = filename ?? (mode === 'revised' ? revisedReportFilename ?? null : reportFilename ?? null)
    if (!fn) return
    if (mode === 'full') setLoadingDetailed(true)
    else setLoadingRevised(true)
    try {
      const resp = await policyService.getDetailedReport(fn)
      if (mode === 'full') {
        setDetailedReport(resp)
      } else {
        setRevisedPolicy(resp as unknown as ReportDetail)
        // some reports include inline content
        try {
          const maybeContent = (resp as unknown as Record<string, unknown>)?.content
          setDetailedContent(typeof maybeContent === 'string' ? maybeContent : null)
        } catch { /* ignore */ }
      }
      setMessage(t('policy_analysis.loaded'))
      setProgress(100)
    } catch (err) {
      console.warn('getDetailedReport failed', err)
      if (mode === 'revised') setRevisedPolicy(null)
      else setDetailedReport(null)
      setMessage(t('policy_analysis.failed_to_load_report'))
      setProgress(0)
    } finally {
      if (mode === 'full') setLoadingDetailed(false)
      else setLoadingRevised(false)
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
        'comprehensive',
        instructions
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
      try { if (typeof stop === 'function') stop() } catch (err) { console.debug('stop() failed', err) }
      setTimeout(() => {/* progress settled */}, 700)
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
    if (!detailedReport && !revisedPolicy) return null
    // prefer explicit download_url field if present. Use unknown->Record check
    // to avoid casting to `any` which the linter flags.
    const maybe = (activeTab === 'full' ? detailedReport : revisedPolicy) as unknown as Record<string, unknown>
  if (maybe.download_url && typeof maybe.download_url === 'string') return String(maybe.download_url)
  // Use the resolved `maybe` record for filename checks to avoid null access
  if (activeTab === 'full' && maybe && typeof maybe['filename'] === 'string' && (maybe['filename'] as string)) return getReportDownloadUrl(String(maybe['filename']))
  if (activeTab === 'revised' && maybe && typeof maybe['filename'] === 'string' && (maybe['filename'] as string)) return getReportDownloadUrl(String(maybe['filename']))
    return null
  })()

  // (RevisedPolicyPreview will receive `detailedDownloadUrl` directly)

  // header handled by usePolicyHeader/PolicyHeader component

  return (
    <div className={twFromTokens('p-8', alignment.flexCol, 'min-h-screen')}>
      <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween, 'mb-6')}>
        {/* Use Heading primitive so size/weight/colors come from centralized tokens */}
        <div>
          {/* avoid importing here to keep top-level file edits small; render inline */}
          <h1 className={twFromTokens(textSizes.h2, fontWeights.bold)}>{t('policy_analysis.title')}</h1>
        </div>

        {(result || reportFilename) ? (
          <div className={twFromTokens(alignment.flex, alignment.itemsCenter, 'gap-2')}>
            {/* Download button removed per UX update */}

                <Button
                  onClick={handleResetAll}
                  className={twFromTokens(buttons.small, 'disabled:opacity-50', 'bg-red-600', colors.ctaText)}
                  icon={<RefreshCcw className={twFromTokens('h-4 w-4')} />}
                  iconColor="text-white"
                  collapseToIcon
                >
                  {t('policy_analysis.reset')}
                </Button>

            <Button
              disabled={!result}
              onClick={handleGenerateReport}
              className={twFromTokens(buttons.small, 'disabled:opacity-50', 'bg-black', colors.ctaText)}
              icon={<FileCheck className={twFromTokens('h-4 w-4')} />}
              iconColor="text-white"
              collapseToIcon
            >{t('policy_analysis.full_report_cta')}</Button>

            <Button
              disabled={!result}
              onClick={() => { const initial = ''; setTitleModalInitial(initial); setTitleModalOpen(true) }}
              className={twFromTokens(buttons.small, 'disabled:opacity-50', 'bg-green-600', colors.ctaText)}
              icon={<Save className={twFromTokens('h-4 w-4')} />}
              iconColor="text-white"
              collapseToIcon
            >{t('policy_analysis.save')}</Button>

            {isFullReportGenerated && (
                <Button
                  disabled={!isFullReportGenerated || !result}
                  onClick={() => { setInstructionsInitial(''); setInstructionsModalOpen(true) }}
                className={twFromTokens(buttons.small, 'disabled:opacity-50', 'bg-purple-600', colors.ctaText)}
                  icon={<Bot className={twFromTokens('h-4 w-4')} />}
                  iconColor="text-white"
                  collapseToIcon
                >{t('policy_analysis.revised_policy_cta')}</Button>
            )}
          </div>
        ) : null}
      </div>

      <InsufficientCreditsModal open={insufficientOpen} onClose={() => setInsufficientOpen(false)} />

      <div className="flex-1 flex flex-col">
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
=======
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import policyService from "../services/policyService";
import type { AnalysisResultForUI } from '../types/api'
import type { ApiError } from '../services/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Shield,
  BarChart,
  Download,
  ArrowLeft,
  Lock,
  Star,
} from "lucide-react";

type AnalysisStep = "upload" | "options" | "analyzing" | "results";

export default function PolicyAnalysis() {
  const { isAuthenticated, isPro, loading } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<AnalysisStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<"basic" | "ai">("basic");
  const [, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultForUI | null>(null)
  const [originalComplianceResult, setOriginalComplianceResult] = useState<any>(null)
  const [currentAnalysisMode, setCurrentAnalysisMode] = useState<string>('fast')
  const [dragOver, setDragOver] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setCurrentStep("options");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (file && isValidFileType(file)) {
      handleFileSelect(file);
    }
  };

  const isValidFileType = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/html",
    ];
    return validTypes.includes(file.type);
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setCurrentStep("analyzing");
    setAnalysisProgress(0);
    setAnalysisMessage('Starting analysis...');
    setAnalysisError(null);

    try {
      // Get the appropriate analysis mode based on the selected type
      const analysisMode = policyService.getAnalysisModeFromType(analysisType)
      setCurrentAnalysisMode(analysisMode)

      // Use streaming analysis for better user experience
      const result = await policyService.analyzePolicyStreaming(
        selectedFile,
        analysisMode,
        (progress, message) => {
          setAnalysisProgress(progress)
          if (message) {
            setAnalysisMessage(message)
          }
        }
      )

      // Store the original result for report generation
      setOriginalComplianceResult(result)

      // Transform the result for UI display
      const uiResult = policyService.transformResultForUI(
        result,
        selectedFile.name,
        analysisMode
      )

      setAnalysisProgress(100)
      setAnalysisResult(uiResult)
      setCurrentStep('results')
    } catch (error) {
      console.error("Analysis failed:", error);
      const apiError = error as ApiError;

      // Handle specific API errors
      if (apiError.status === 403 && apiError.details?.upgrade_required) {
        setAnalysisError(
          `${apiError.message}. You requested ${apiError.details.requested_mode} mode, but only ${apiError.details.available_mode} mode is available on your plan.`
        );
      } else {
        setAnalysisError(
          apiError.message || "Analysis failed. Please try again."
        );
      }

      // Reset to options step so user can try again or change settings
      setCurrentStep("options");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setAnalysisResult(null)
    setOriginalComplianceResult(null)
    setCurrentAnalysisMode('fast')
    setAnalysisProgress(0)
    setAnalysisMessage('')
    setIsAnalyzing(false)
    setAnalysisError(null)
    setIsGeneratingReport(false)
  }

  const handleDownloadReport = async () => {
    if (!originalComplianceResult || !analysisResult) return

    setIsGeneratingReport(true)
    try {
      // Generate the report
      const reportInfo = await policyService.generateVerificationReport(
        originalComplianceResult,
        analysisResult.filename,
        currentAnalysisMode as any
      )

      // Download the report
      await policyService.downloadReport(reportInfo.filename)
    } catch (error) {
      console.error('Report generation/download failed:', error)
      const apiError = error as ApiError
      setAnalysisError(`Failed to generate report: ${apiError.message || 'Unknown error'}`)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Policy Analysis
          </h1>
          <p className="text-gray-600">
            Upload and analyze your privacy policy for GDPR compliance
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { step: "upload", label: "Upload", icon: Upload },
              { step: "options", label: "Options", icon: Shield },
              { step: "analyzing", label: "Analysis", icon: Clock },
              { step: "results", label: "Results", icon: BarChart },
            ].map(({ step, label, icon: Icon }, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    currentStep === step ||
                    (["options", "analyzing", "results"].indexOf(currentStep) >=
                      ["options", "analyzing", "results"].indexOf(step) &&
                      currentStep !== "upload")
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="ml-2 text-sm font-medium text-gray-600">
                  {label}
                </span>
                {index < 3 && (
                  <div
                    className={`w-16 h-0.5 ml-4 transition-colors ${
                      ["options", "analyzing", "results"].indexOf(currentStep) >
                        index - 1 && currentStep !== "upload"
                        ? "bg-blue-600"
                        : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {currentStep === "upload" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">
                Upload Privacy Policy
              </CardTitle>
              <CardDescription className="text-center">
                Upload your privacy policy document for GDPR compliance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your file here, or click to browse
                </h3>
                <p className="text-gray-500 mb-4">
                  Supports PDF, DOCX, TXT, and HTML files up to 10MB
                </p>
                <Button
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  variant="outline"
                >
                  Choose File
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.html"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && isValidFileType(file)) {
                      handleFileSelect(file);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "options" && selectedFile && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Selected File */}
            <Card>
              <CardHeader>
                <CardTitle>Selected File</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Options */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Options</CardTitle>
                <CardDescription>
                  Choose the type of analysis for your privacy policy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Analysis */}
                <div
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    analysisType === "basic"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => {
                    setAnalysisType("basic");
                    setAnalysisError(null);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="h-6 w-6 text-green-600" />
                      <div>
                        <h3 className="font-medium">Basic Analysis</h3>
                        <p className="text-sm text-gray-600">
                          Rule-based compliance checking with essential
                          recommendations
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        FREE
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          analysisType === "basic"
                            ? "border-blue-500 bg-blue-500"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                <div
                  className={`border rounded-lg p-4 transition-colors ${
                    !isPro
                      ? "opacity-60 cursor-not-allowed border-gray-200"
                      : analysisType === "ai"
                      ? "border-blue-500 bg-blue-50 cursor-pointer"
                      : "border-gray-200 hover:border-gray-300 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (isPro) {
                      setAnalysisType("ai");
                      setAnalysisError(null);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap
                        className={`h-6 w-6 ${
                          isPro ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          AI-Powered Analysis
                          {!isPro && <Lock className="h-4 w-4 text-gray-400" />}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Advanced AI analysis with confidence scores and
                          detailed insights
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        PRO
                      </span>
                      {isPro && (
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            analysisType === "ai"
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  </div>
                  {!isPro && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Upgrade to Pro
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {analysisError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-medium">Analysis Failed</p>
                  </div>
                  <p className="text-red-700 mt-2">{analysisError}</p>
                </CardContent>
              </Card>
            )}

            {/* Start Analysis */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep("upload")}
              >
                Change File
              </Button>
              <Button
                onClick={startAnalysis}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Analysis
              </Button>
            </div>
          </div>
        )}

        {currentStep === "analyzing" && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">Analyzing Policy</CardTitle>
              <CardDescription className="text-center">
                {analysisType === "ai"
                  ? "AI is performing deep analysis of your privacy policy..."
                  : "Performing rule-based compliance analysis..."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} className="w-full" />
              </div>

              <div className="text-center text-sm text-gray-600">
                <p className="font-medium text-blue-600 mb-2">{analysisMessage}</p>
                <p>This may take a few moments...</p>
                <p className="mt-1">Filename: {selectedFile?.name}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "results" && analysisResult && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Results Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      Analysis Complete
                    </CardTitle>
                    <CardDescription>
                      Analysis completed for {analysisResult.filename}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-3xl font-bold ${getScoreColor(
                        analysisResult.score
                      )}`}
                    >
                      {analysisResult.score}/100
                    </div>
                    <p className="text-sm text-gray-600">Compliance Score</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {analysisResult.timestamp.toLocaleString()}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        analysisResult.analysisType === "ai"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {analysisResult.analysisType === "ai"
                        ? "AI Analysis"
                        : "Basic Analysis"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {analysisResult.analysisType === 'ai' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadReport}
                        disabled={isGeneratingReport}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isGeneratingReport ? 'Generating...' : 'Download Report'}
                      </Button>
                    )}
                    <Button onClick={resetAnalysis} variant="outline" size="sm">
                      New Analysis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Violations */}
            <Card>
              <CardHeader>
                <CardTitle>Detected Violations</CardTitle>
                <CardDescription>
                  Issues found in your privacy policy that require attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.violations.map((violation, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                          <h3 className="font-medium">{violation.category}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(
                              violation.severity
                            )}`}
                          >
                            {violation.severity.toUpperCase()}
                          </span>
                          {violation.confidence && (
                            <span className="text-xs text-gray-500">
                              {Math.round(violation.confidence * 100)}%
                              confidence
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">
                        {violation.description}
                      </p>
                      <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                        <p className="text-sm text-blue-800">
                          <strong>Recommendation:</strong>{" "}
                          {violation.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>General Recommendations</CardTitle>
                <CardDescription>
                  Overall suggestions to improve GDPR compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysisResult.recommendations.map(
                    (recommendation, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <p className="text-gray-700">
                          {typeof recommendation === "string"
                            ? recommendation
                            : recommendation.suggestion}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
>>>>>>> main
