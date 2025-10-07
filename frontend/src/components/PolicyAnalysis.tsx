import React, { useEffect, useState, useRef } from 'react'
import policyService, { type ReportDetail } from '@/services/policyService'
import EnterTitleModal from './ui/EnterTitleModal'
import useAuth from '@/contexts/useAuth'
import type { ComplianceResult } from '@/types/api'
import { UploadCloud, RefreshCcw, DownloadCloud, ExternalLink, Save, FileCheck, X, Bot, Lightbulb, CheckCircle2, FileText, AlertTriangle, BarChart, FileSearch, Star as LucideStar } from 'lucide-react'
import { Star, StarHalf, Star as StarEmpty } from 'phosphor-react'
import useSavedReportsCounter from '@/hooks/useSavedReportsCounter'
import { renderMarkdownToHtml } from '@/lib/policyAnalysisHelpers'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/progress'
import FindingCard from '@/components/ui/FindingCard'
import SidebarFindingItem from '@/components/ui/SidebarFindingItem'
// ReportCard intentionally not used here — full report uses custom layout
// EvidenceItem unused in this view (detailed report uses markdown/content or simple blocks)
import InsufficientCreditsModal from './ui/InsufficientCreditsModal'
import { formatVerdictLabel, formatFileMeta, getReportDownloadUrl } from '@/lib/policyHelpers'
import { safeDispatch, safeDispatchMultiple } from '@/lib/eventHelpers'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setState as setPolicyState, resetState as resetPolicyState } from '@/store/policyAnalysisSlice'
import type { RootState } from '@/store/store'

// Local helper types removed (not used here). The detailed report shape is `ReportDetail` imported from policyService.

export default function PolicyAnalysis() {
  const { isAuthenticated, loading, refreshUser } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [message, setMessage] = useState<string>('')
  const [result, setResult] = useState<ComplianceResult | null>(null)
  const [reportFilename, setReportFilename] = useState<string | null>(null)
  const [isFullReportGenerated, setIsFullReportGenerated] = useState<boolean>(false)
  const [userReportsCount, setUserReportsCount] = useState<number | null>(null)
  // progress bar visibility is derived from `progress` value
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // tabs
  const [activeTab, setActiveTab] = useState<'free' | 'full' | 'revised'>('free')
  const [detailedContent, setDetailedContent] = useState<string | null>(null)
  const [detailedReport, setDetailedReport] = useState<ReportDetail | null>(null)
  const [loadingDetailed, setLoadingDetailed] = useState<boolean>(false)
  // Separate loading state for revised reports so the "full report" loader
  // does not show when a revised policy is being generated/loaded.
  const [loadingRevised, setLoadingRevised] = useState<boolean>(false)

  const [titleModalOpen, setTitleModalOpen] = useState(false)
  const [titleModalInitial, setTitleModalInitial] = useState<string>('')
  const [insufficientOpen, setInsufficientOpen] = useState(false)

  const saveProgressIntervalRef = useRef<number | null>(null)
  const dispatch = useAppDispatch()
  const persisted = useAppSelector((s: RootState) => s.policyAnalysis)

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
      if (typeof persisted.isFullReportGenerated === 'boolean') setIsFullReportGenerated(persisted.isFullReportGenerated)
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
        isFullReportGenerated,
      })
    )
  }, [file, progress, message, result, reportFilename, isFullReportGenerated, dispatch])

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
    }
    window.addEventListener('report:generated', handler as EventListener)
    return () => window.removeEventListener('report:generated', handler as EventListener)
  }, [])

  // Determine whether the current tab is in a loading state. We keep
  // separate flags for full vs revised so their UIs can be distinct.
  const isLoadingForTab = activeTab === 'full' ? loadingDetailed : activeTab === 'revised' ? loadingRevised : false

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!isAuthenticated) return <div className="min-h-screen flex items-center justify-center">Please login to analyze policies.</div>

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0])
  }

  const startIndeterminateProgress = (startMessage = 'Working...') => {
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
    if (!file) return
    // show quick/free analysis and clear any loaded detailed report
    setActiveTab('free')
    setDetailedReport(null)
    setDetailedContent(null)
    setProgress(0)
    setMessage('Starting...')
    const stop = startIndeterminateProgress('Analyzing...')
    // progress shown by progress value
    try {
      setIsFullReportGenerated(false)
      const res = await policyService.analyzePolicyStreaming(file, 'balanced', (progressVal, msg) => {
        setProgress(progressVal ?? 0)
        setMessage(msg ?? '')
      })
      setResult(res)
      setMessage('Completed')
      setProgress(100)
      // ensure free tab displays final quick result
      setActiveTab('free')
      try { await refreshUser() } catch (e) { console.warn('Failed to refresh user after analysis', e) }
      try { safeDispatchMultiple([{ name: 'payment:refresh-user' }, { name: 'transactions:refresh' }]) } catch (err) { console.debug('safeDispatchMultiple failed', err) }
      setTimeout(() => {/* progress settled */}, 700)
    } catch (err: unknown) {
      if (err instanceof Error) setMessage(err.message)
      else if (typeof err === 'string') setMessage(err)
      else setMessage('Analysis failed')
      setTimeout(() => {/* progress settled */}, 700)
    } finally {
      if (typeof stop === 'function') stop()
      setTimeout(() => {/* progress settled */}, 700)
    }
  }

  const handleGenerateReport = async () => {
    if (!result) return
    const stop = startIndeterminateProgress('Generating report...')
    try {
      const documentName = file?.name ?? (persisted?.fileName as string | undefined) ?? 'policy'
      const resp = await policyService.generateVerificationReport(result, documentName, 'balanced')
      if (resp?.filename) {
        setReportFilename(resp.filename)
        setIsFullReportGenerated(true)
  try { safeDispatch('report:generated', { path: resp.filename, download_url: resp.download_url }) } catch (err) { console.debug('safeDispatch failed', err) }
      }
      setMessage('Report generated')
      setProgress(100)
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
      setMessage(e instanceof Error ? e.message : 'Generate failed')
    } finally {
  try { stop() } catch { /* ignore */ }
      setTimeout(() => {/* progress settled */}, 700)
    }
  }

  const handleSaveReport = async (filename?: string, documentName?: string) => {
    if (!filename) return
    const stop = startIndeterminateProgress('Saving report...')
    try {
      const isQuick = !isFullReportGenerated
      const resp = await policyService.saveReport(filename, documentName, { is_quick: isQuick })
      if (resp?.filename) setReportFilename(resp.filename)
      setMessage('Saved')
      setProgress(100)
  try { const n = await policyService.getUserReportsCount(); setUserReportsCount(n ?? 0) } catch (err) { console.debug('getUserReportsCount failed', err) }
  try { await refreshUser() } catch (err) { console.debug('refreshUser failed', err) }
  try { safeDispatchMultiple([{ name: 'transactions:refresh' }, { name: 'payment:refresh-user' }, { name: 'reports:refresh' }]) } catch (err) { console.debug('safeDispatchMultiple failed', err) }
  try { safeDispatch('reports:refresh') } catch (err) { console.debug('safeDispatch failed', err) }
    } catch (e: unknown) {
      try {
        const maybe = e as unknown as Record<string, unknown>
        if (maybe && 'status' in maybe && maybe.status === 402) setInsufficientOpen(true)
      } catch (err) { console.debug('inspect save error failed', err) }
      setMessage(e instanceof Error ? e.message : 'Save failed')
    } finally {
      stop()
  setTimeout(() => {/* progress settled */}, 700)
    }
  }

  const handleGenerateRevision = async () => {
    if (!result) return
    const stop = startIndeterminateProgress('Generating revised policy...')
    try {
      const original = (file ? await file.text() : '') || ''
      const resp = await policyService.generatePolicyRevision(
        original,
        (result.findings || []) as unknown as Record<string, unknown>[],
        (result.recommendations || []) as unknown as Record<string, unknown>[],
        (result.evidence || []) as unknown as Record<string, unknown>[],
        file?.name ?? (persisted?.fileName as string | undefined) ?? 'policy',
        'comprehensive'
      )
      if (resp?.filename) {
        setReportFilename(resp.filename)
        setMessage('Revised policy generated')
        try { const n = await policyService.getUserReportsCount(); setUserReportsCount(n ?? 0) } catch (err) { console.debug('getUserReportsCount failed', err) }
        try { await refreshUser() } catch (err) { console.debug('refreshUser failed', err) }
        try { safeDispatchMultiple([{ name: 'transactions:refresh' }, { name: 'payment:refresh-user' }, { name: 'reports:refresh' }]) } catch (err) { console.debug('safeDispatchMultiple failed', err) }
      }
    } catch (e: unknown) {
      try {
        const maybe = e as unknown as Record<string, unknown>
        if (maybe && 'status' in maybe && maybe.status === 402) setInsufficientOpen(true)
      } catch (err) { console.debug('inspect revision error failed', err) }
      setMessage(e instanceof Error ? e.message : 'Revision failed')
    } finally {
      stop()
      setTimeout(() => {/* progress settled */}, 700)
    }
  }

  const loadDetailed = async (filename?: string, mode: 'full' | 'revised' = 'full') => {
    const fn = filename ?? reportFilename
    if (!fn) return
    if (mode === 'full') setLoadingDetailed(true)
    else setLoadingRevised(true)
    try {
      const resp = await policyService.getDetailedReport(fn)
      setDetailedReport(resp ?? null)
      setDetailedContent(resp?.content ?? null)
      // When detailed content is available, ensure the progress UI reflects completion
      setMessage('Loaded')
      setProgress(100)
    } catch (e) {
      console.warn('getDetailedReport failed', e)
      setDetailedReport(null)
      setDetailedContent(null)
      // on failure, reset progress/message so UI doesn't hang at an in-between state
      setMessage('Failed to load report')
      setProgress(0)
    } finally {
      if (mode === 'full') setLoadingDetailed(false)
      else setLoadingRevised(false)
    }
  }

  // Convenience wrappers that make intent explicit in the JSX
  const loadFull = async (filename?: string) => {
    return loadDetailed(filename, 'full')
  }

  const loadRevised = async (filename?: string) => {
    return loadDetailed(filename, 'revised')
  }

  // helpers moved to lib/policyAnalysisHelpers

  // When rendering the Full dashboard prefer the structured JSON payload
  // coming either from a fetched detailedReport or the streaming `result`.
  const fullReportSource = (detailedReport ?? result) as (Record<string, unknown> | null)

  return (
    <div className="p-8 flex flex-col min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Policy Analysis</h1>

        {(result || reportFilename) ? (
          <div className="flex items-center gap-2">
            <Button
              disabled={!reportFilename}
              onClick={() => { if (!reportFilename) return; const url = getReportDownloadUrl(reportFilename as string); window.open(url, '_blank') }}
              className="px-3 py-1 bg-yellow-500 text-white rounded disabled:opacity-50"
              icon={<DownloadCloud className="h-4 w-4" />}
              iconColor="text-white"
              collapseToIcon
            >
              Download
            </Button>

                <Button
                  onClick={async () => {
                    try { dispatch(resetPolicyState()) } catch (err) { console.warn('failed to reset persisted policy state', err) }
                    setFile(null); setResult(null); setReportFilename(null); setIsFullReportGenerated(false); setProgress(0); setMessage('')
                    try {
                      const r = await policyService.getUserReports()
                      if (Array.isArray(r)) setUserReportsCount(r.length)
                      else if (r && typeof r === 'object') {
                        const maybe = r as Record<string, unknown>
                        const total = typeof maybe.total === 'number' ? maybe.total : (Array.isArray(maybe.reports) ? maybe.reports.length : 0)
                        setUserReportsCount(total)
                      }
                    } catch (err) { console.debug('refresh reports after reset failed', err) }
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
                  icon={<RefreshCcw className="h-4 w-4" />}
                  iconColor="text-white"
                  collapseToIcon
                >
                  Reset
                </Button>

            <Button disabled={!result} onClick={handleGenerateReport} className="px-3 py-1 bg-black text-white rounded disabled:opacity-50" icon={<FileCheck className="h-4 w-4" />} iconColor="text-white" collapseToIcon>Full Report</Button>

            <Button disabled={!reportFilename} onClick={() => { if (!reportFilename) return; setTitleModalInitial(reportFilename); setTitleModalOpen(true) }} className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50" icon={<Save className="h-4 w-4" />} iconColor="text-white" collapseToIcon>Save</Button>

            {isFullReportGenerated && (
              <Button disabled={!isFullReportGenerated || !result} onClick={handleGenerateRevision} className="px-3 py-1 bg-purple-600 text-white rounded disabled:opacity-50" icon={<Bot className="h-4 w-4" />} iconColor="text-white" collapseToIcon>Generate Revised</Button>
            )}
          </div>
        ) : null}
      </div>

      <InsufficientCreditsModal open={insufficientOpen} onClose={() => setInsufficientOpen(false)} />

      <div className="flex-1 flex flex-col">
        {persisted && persisted.fileName ? (
          <div className="mb-2 w-40 px-3 py-1 text-center rounded bg-yellow-100 text-yellow-500 font-medium">Work In Progress</div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <aside className="md:col-span-1 bg-white p-4 rounded shadow">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Upload policy</label>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) setFile(f) }}
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 h-48 w-full rounded-lg border-2 border-dashed border-blue-200 bg-gradient-to-b from-white/50 to-blue-50 flex flex-col items-center justify-center text-center px-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept=".pdf,.docx,.html,.htm,.txt" />
                <UploadCloud className="h-10 w-10 text-blue-500 mb-3" />
                <div className="text-sm font-medium text-gray-700">Drag & drop a policy file here, or click to browse</div>
                <div className="text-xs text-gray-500 mt-1">Supports PDF, DOCX, HTML, TXT</div>
                <div className="mt-3 flex items-center gap-3">
                  <Button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }} className="border border-blue-200 text-blue-700 px-3 py-1 rounded-md shadow-sm hover:bg-blue-50" icon={<UploadCloud className="h-4 w-4" />} iconColor="text-white" collapseToIcon>Browse files</Button>
                  {file ? (
                      <Button type="button" onClick={(e) => { e.stopPropagation(); setFile(null) }} className="px-3 py-1 bg-red-600 text-white rounded-md" icon={<X className="h-4 w-4" />} iconColor="text-white" collapseToIcon>Remove</Button>
                    ) : null}
                </div>
              </div>
            </div>

            {file && (
              <div className="mt-3 text-sm text-gray-700">
                <div className="font-medium">Selected file</div>
                <div className="text-xs text-gray-500">{formatFileMeta(file)}</div>
              </div>
            )}

            <div className="mt-3">
              <Button disabled={!file} onClick={handleAnalyze} className="w-full px-3 py-2 bg-indigo-600 text-white rounded">Analyze</Button>
            </div>

            <div className="mb-4 mt-4"><h3 className="font-semibold">Summary</h3><div className="text-sm text-gray-700 mt-2">{result?.summary || 'No result yet'}</div></div>

            <div className="mb-4 mt-4"><h3 className="font-semibold">Findings ({result?.findings?.length ?? 0})</h3>
              <div className="text-sm text-gray-700 mt-2 max-h-40 overflow-auto">
                {result?.findings && result.findings.length > 0 ? (
                  // Render findings as stacked items (SidebarFindingItem already renders
                  // a block-level element). This avoids nesting <li> elements (some
                  // builds compiled SidebarFindingItem as an <li> which causes
                  // hydration mismatches when wrapped in another <li>).
                  <div className="space-y-2">
                    {result.findings.map((f, idx) => (
                      <SidebarFindingItem key={idx} article={f.article} issue={f.issue} />
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No findings</div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold">Total Saved Past Reports {userReportsCount !== null ? `(` : ''}
                {/** hide until loaded, then ramp */}
                {userReportsCount !== null ? (
                  <SavedReportsCountDisplay count={userReportsCount} />
                ) : null}
                {userReportsCount !== null ? ` total)` : ''}
              </h3>
              <div className="mt-2">
                {reportFilename ? (
                  <div className="space-y-2"><div className="text-sm">Generated: <span className="font-medium">{reportFilename}</span></div></div>
                ) : (
                  <div className="text-sm text-gray-500">No report generated yet</div>
                )}
              </div>
            </div>
          </aside>

          <main className="md:col-span-2 bg-white p-4 rounded shadow flex flex-col min-h-0 overflow-hidden">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Analysis Result</h2>
                <div className="text-sm text-gray-600">Result Broken Down / Report Preview</div>
              </div>
              <div className="text-sm text-gray-600">{result ? `${result.verdict} • Score ${result.score}` : ''}</div>
            </div>

            {/* Progress bar and message shown during streaming analysis */}
            {(progress > 0 && progress < 100) && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-700">{message || 'Analyzing...'}</div>
                  <div className="text-sm text-gray-500">{Math.min(100, Math.max(0, progress))}%</div>
                </div>
                <Progress value={Math.min(100, Math.max(0, progress))} className="h-2" />
              </div>
            )}

            <div className="mb-3">
              <div className="flex items-center">
                <button className={`px-3 py-1 border text-sm flex items-center ${activeTab === 'free' ? 'bg-blue-600 text-white border-blue-600 rounded-l' : 'bg-white text-gray-700 border-gray-200 rounded-l'}`} onClick={() => setActiveTab('free')}>
                  <Lightbulb className="h-4 w-4 mr-2" /> Free
                </button>
                <button className={`px-3 py-1 border text-sm flex items-center ${activeTab === 'full' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`} onClick={async () => { setActiveTab('full'); await loadFull() }}>
                  <FileCheck className="h-4 w-4 mr-2" /> Full
                </button>
                <button className={`px-3 py-1 border text-sm flex items-center ${activeTab === 'revised' ? 'bg-blue-600 text-white border-blue-600 rounded-r' : 'bg-white text-gray-700 border-gray-200 rounded-r'}`} onClick={async () => { setActiveTab('revised'); await loadRevised() }}>
                  <Bot className="h-4 w-4 mr-2" /> Revised
                </button>

                <div className="ml-auto">
                  <Button
                    disabled={!reportFilename}
                    onClick={() => {
                      if (!reportFilename) return
                      try {
                        const url = getReportDownloadUrl(reportFilename)
                        window.open(url, '_blank')
                      } catch {
                        if (detailedContent) {
                          const w = window.open('', '_blank')
                          if (w) {
                            w.document.write(`<html><head><title>${reportFilename}</title></head><body><pre style="white-space:pre-wrap; font-family:inherit">${String(detailedContent)}</pre></body></html>`)
                            w.document.close()
                            w.print()
                          }
                        }
                      }
                    }}
                    className="px-3 py-1 bg-yellow-500 text-white rounded"
                    icon={<DownloadCloud className="h-4 w-4" />}
                    iconColor="text-white"
                    collapseToIcon
                  >
                    Download view
                  </Button>
                </div>
              </div>
            </div>

            <div className="h-full flex-1 min-h-0">
              {activeTab === 'free' ? (
                result ? (
                  <div className="bg-gray-50 p-4 rounded h-full min-h-0 overflow-auto w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">Verdict</div>
                        <div className="text-lg font-semibold">{formatVerdictLabel(result.verdict)}</div>
                        <div className="text-sm text-gray-500">Confidence: {(result.confidence * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Score</div>
                        <div className="flex items-center">
                          {(() => {
                            const stars = Math.round(((result.score ?? 0) / 100) * 5)
                            return Array.from({ length: 5 }).map((_, idx) => (
                              <svg key={idx} className={`h-5 w-5 ${idx < stars ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.39 2.462a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118l-3.39-2.462a1 1 0 00-1.176 0l-3.39 2.462c-.784.57-1.84-.197-1.54-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.047 9.393c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.966z" />
                              </svg>
                            ))
                          })()}
                          <div className="ml-3 text-sm text-gray-600">{result.score}%</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-800 whitespace-pre-wrap">{result.summary}</div>
                    <div className="mt-4">
                      <h4 className="font-medium">Top Findings</h4>
                      <div className="mt-2 space-y-2">
                        {result.findings && result.findings.length > 0 ? result.findings.slice(0, 6).map((f, i) => (
                          <FindingCard key={i} finding={f} />
                        )) : <div className="text-sm text-gray-500">No findings detected.</div>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-100">
                        <UploadCloud className="h-10 w-10 text-gray-500" />
                      </div>
                      <div className="mt-4 text-lg font-semibold">No analysis yet</div>
                      <div className="mt-2 text-sm text-gray-500">Upload a policy file and click <span className="font-medium">Analyze</span> to run a quick analysis.</div>
                    </div>
                  </div>
                )
              ) : (
                <div className="bg-gray-50 p-4 rounded h-full min-h-0 overflow-auto w-full">
                  {isLoadingForTab ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-white shadow">
                          <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                          </svg>
                        </div>
                        <div className="mt-4 text-lg font-semibold">Loading report…</div>
                        <div className="mt-2 text-sm text-gray-500">This may take a moment — fetching the detailed report.</div>
                      </div>
                    </div>
                  ) : (
                    // Full uses structured JSON (detailedReport or streaming result),
                    // Revised uses stored file content (markdown). Favor fullReportSource
                    // for the dashboard UI when on the Full tab.
                    activeTab === 'full' ? (
                      fullReportSource ? (
                        // Render dashboard from the available source
                        (() => {
                          const src = fullReportSource as Record<string, unknown>
                          const confidence = Number(src['confidence'] ?? 0)
                          const score = Number(src['score'] ?? 0)
                          const findings = (src['findings'] ?? []) as Array<Record<string, unknown>>
                          const recommendations = (src['recommendations'] ?? []) as Array<Record<string, unknown>>
                          const evidence = (src['evidence'] ?? []) as Array<Record<string, unknown>>
                          const metrics = (src['metrics'] ?? {}) as Record<string, unknown>
                          return (
                            <div className="bg-gray-50 p-4 rounded h-full min-h-0 overflow-auto w-full">
                              <div className="flex items-start justify-between gap-6">
                                <div>
                                  <div className="text-sm text-gray-500 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />Verdict</div>
                                  <div className="mt-1 flex items-center gap-3">
                                    <div className="text-lg font-semibold">{String(src['verdict'] ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => (c as string).toUpperCase())}</div>
                                    <div className="text-sm text-gray-500">Confidence: {Math.round(confidence * 100)}%</div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-6">
                                  <div className="text-sm text-gray-500 flex items-center gap-2"><LucideStar className="h-4 w-4 text-yellow-500" />Score</div>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                      {(() => {
                                        const sc = Math.max(0, Math.min(100, score))
                                        const stars = (sc / 100) * 5
                                        const full = Math.floor(stars)
                                        const half = stars - full >= 0.5 ? 1 : 0
                                        const empty = 5 - full - half
                                        const icons: React.ReactElement[] = []
                                        for (let i = 0; i < full; i++) icons.push(<Star key={`f-${i}`} size={18} weight="fill" className="text-yellow-500" />)
                                        if (half) icons.push(<StarHalf key={`h`} size={18} className="text-yellow-500" />)
                                        for (let i = 0; i < empty; i++) icons.push(<StarEmpty key={`e-${i}`} size={18} weight="duotone" className="text-gray-300" />)
                                        return <div className="flex items-center">{icons}</div>
                                      })()}
                                    </div>
                                    <div className="text-sm text-gray-600">{score}%</div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                  <div className="text-sm font-medium text-gray-700 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-600"/>Summary</div>
                                  <div className="mt-2 text-sm text-gray-800 whitespace-pre-wrap">{String(src['summary'] ?? '')}</div>

                                  <div className="mt-4">
                                    <div className="text-sm font-medium text-gray-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500"/>Top Findings</div>
                                    <div className="mt-2 space-y-3">
                                      {(() => {
                                        if ((findings || []).length === 0) return <div className="text-sm text-gray-500">No findings detected.</div>
                                        return (['high', 'medium', 'low'] as const).map((sev) => {
                                          const items = (findings || []).filter((f) => String(f['severity']) === sev)
                                          if (items.length === 0) return null
                                          const bg = sev === 'high' ? 'bg-red-600' : sev === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
                                          const pill = sev === 'high' ? 'bg-red-700' : sev === 'medium' ? 'bg-yellow-700' : 'bg-green-700'
                                          return (
                                            <div key={sev}>
                                              <div className="flex items-center gap-2">
                                                <div className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${pill}`}>{sev.toUpperCase()}</div>
                                                <div className="text-xs text-gray-500">{items.length} issue{items.length !== 1 ? 's' : ''}</div>
                                              </div>
                                              <div className="mt-2 space-y-2">
                                                {items.slice(0, 5).map((f, idx) => {
                                                  const article = f['article'] ?? ''
                                                  const issue = f['issue'] ?? ''
                                                  const conf = Number(f['confidence'] ?? 0)
                                                  return (
                                                    <div key={idx} className={`${bg} p-3 rounded shadow`}>
                                                      <div className="flex items-start gap-3">
                                                        <div className="p-2 rounded bg-white/10 flex-shrink-0">
                                                          <FileText className="h-5 w-5 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                          <div className="font-semibold text-sm text-white break-words">{String(article)}</div>
                                                          <div className="text-sm text-white mt-1 break-words whitespace-pre-wrap">{String(issue)}</div>
                                                          <div className="text-xs text-white/90 mt-1">Confidence: {Math.round(conf * 100)}%</div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )
                                                })}
                                              </div>
                                            </div>
                                          )
                                        })
                                      })()}
                                    </div>
                                  </div>

                                  <div className="mt-4">
                                    <div className="text-sm font-medium text-gray-700 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-yellow-600"/>Recommendations</div>
                                    <ul className="mt-2 list-disc list-inside text-sm text-gray-800">
                                      {(() => {
                                        if ((recommendations || []).length === 0) return <li className="text-sm text-gray-500">No recommendations</li>
                                        return (recommendations || []).map((r, i) => (
                                          <li key={i}>{String(r['suggestion'] ?? JSON.stringify(r))} <span className="text-xs text-gray-500">({String(r['article'] ?? '')})</span></li>
                                        ))
                                      })()}
                                    </ul>
                                  </div>
                                </div>

                                <aside className="md:col-span-1">
                                  <div className="text-sm font-medium text-gray-700 flex items-center gap-2"><BarChart className="h-4 w-4 text-blue-600"/>Metrics</div>
                                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                                    {(() => {
                                      const total = Number(metrics['total_violations'] ?? 0)
                                      const fulfills = Number(metrics['total_fulfills'] ?? 0)
                                      const critical = Number(metrics['critical_violations'] ?? 0)
                                      return (
                                        <>
                                          <div>Total Violations: <span className="font-semibold">{total}</span></div>
                                          <div>Requirements Met: <span className="font-semibold">{fulfills}</span></div>
                                          <div>Critical Violations: <span className="font-semibold text-red-600">{critical}</span></div>
                                        </>
                                      )
                                    })()}
                                  </div>

                                  <div className="mt-4">
                                    <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                      <FileSearch className="h-4 w-4 text-gray-600"/>
                                      <span>Evidence</span>
                                      <div className="px-2 py-0.5 rounded text-xs text-gray-500 bg-gray-100">{`(${(evidence || []).length})`}</div>
                                    </div>
                                    <div className="mt-2 space-y-2 text-sm text-gray-700">
                                        {(evidence || []).length > 0 ? (
                                        (evidence || []).slice(0, 6).map((e, i) => (
                                          <div key={i} className="p-3 rounded shadow bg-green-700 text-white">
                                            <div className="flex items-start gap-3">
                                              <div className="p-2 rounded bg-white/10 flex-shrink-0">
                                                <FileText className="h-5 w-5 text-white" />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="font-semibold break-words">{String(e['article'] ?? '')}</div>
                                                <div className="text-xs mt-1 whitespace-pre-wrap break-words">{String(e['policy_excerpt'] ?? '')}</div>
                                              </div>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-sm text-gray-500">No evidence excerpts</div>
                                      )}
                                    </div>
                                  </div>
                                </aside>
                              </div>
                            </div>
                          )
                        })()
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <div className="text-center p-6">
                            <div className="mx-auto w-40 h-40 flex items-center justify-center rounded-full bg-gray-100">
                              <svg className="h-20 w-20 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </div>
                            <div className="mt-4 text-xl font-semibold">No detailed content yet</div>
                            <div className="mt-2 text-sm text-gray-500">This report has not been generated or persisted yet. Try generating the Full Report or refresh later.</div>
                          </div>
                        </div>
                      )
                    ) : (
                      // revised tab: uses saved file content (markdown)
                      detailedContent ? (
                        <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(detailedContent) }} />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <div className="text-center p-6">
                            <div className="mx-auto w-40 h-40 flex items-center justify-center rounded-full bg-gray-100">
                              <svg className="h-20 w-20 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </div>
                            <div className="mt-4 text-xl font-semibold">No detailed content yet</div>
                            <div className="mt-2 text-sm text-gray-500">This report has not been generated or persisted yet. Try generating the Full Report or refresh later.</div>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {titleModalOpen && (
        <EnterTitleModal
          open={titleModalOpen}
          initial={titleModalInitial}
          onClose={() => setTitleModalOpen(false)}
            onConfirm={async (title) => {
            if (!reportFilename) return
            try { await handleSaveReport(reportFilename, title) } catch (e) { console.warn('save from title modal failed', e) }
            setTitleModalOpen(false)
            try { safeDispatch('transactions:refresh') } catch (err) { console.debug('safeDispatch failed', err) }
          }}
        />
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              disabled={!reportFilename}
              onClick={() => { if (!reportFilename) return; const url = getReportDownloadUrl(reportFilename); window.open(url, '_blank') }}
              className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
              icon={<ExternalLink className="h-4 w-4" />}
            />
            <Button
              disabled={!reportFilename}
              onClick={async () => { if (!reportFilename) return; try { await policyService.downloadReport(reportFilename) } catch (e) { console.warn('download failed', e) } }}
              className="px-3 py-1 bg-yellow-500 text-white rounded disabled:opacity-50"
              icon={<DownloadCloud className="h-4 w-4" />}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              disabled={!file}
              onClick={() => { void handleAnalyze() }}
              className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-50"
              icon={<FileCheck className="h-4 w-4" />}
            />
            <Button
              disabled={!reportFilename}
              onClick={() => { if (!reportFilename) return; setTitleModalInitial(reportFilename); setTitleModalOpen(true) }}
              className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
              icon={<Save className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Small helper component: animate a single numeric count using the shared hook.
function SavedReportsCountDisplay({ count }: { count: number }) {
  const enabled = count !== null && typeof count !== 'undefined'
  const animated = useSavedReportsCounter(count ?? 0, enabled)
  return <span className="font-medium">{enabled ? animated : ''}</span>
}
