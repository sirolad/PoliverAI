import React, { useEffect, useState, useRef } from 'react'
import policyService, { type ReportDetail } from '@/services/policyService'
import EnterTitleModal from './ui/EnterTitleModal'
import useAuth from '@/contexts/useAuth'
import type { ComplianceResult } from '@/types/api'
import { UploadCloud, RefreshCcw, DownloadCloud, ExternalLink, Save, FileCheck, X, Bot, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/progress'
import FindingCard from '@/components/ui/FindingCard'
import SidebarFindingItem from '@/components/ui/SidebarFindingItem'
import InsufficientCreditsModal from './ui/InsufficientCreditsModal'
import { formatVerdictLabel, formatFileMeta, getReportDownloadUrl } from '@/lib/policyHelpers'
import { safeDispatch, safeDispatchMultiple } from '@/lib/eventHelpers'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { setState as setPolicyState, resetState as resetPolicyState } from '@/store/policyAnalysisSlice'
import type { RootState } from '@/store/store'

type FindingLike = { article?: string | number; issue?: string; confidence?: number; severity?: string }
type RecommendationLike = { article?: string | number; suggestion?: string }
type EvidenceLike = { article?: string | number; policy_excerpt?: string; score?: number; rationale?: string }

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

  const loadDetailed = async (filename?: string) => {
    const fn = filename ?? reportFilename
    if (!fn) return
    setLoadingDetailed(true)
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
      setLoadingDetailed(false)
    }
  }

  const escapeHtml = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const renderMarkdownToHtml = (md: string) => {
    if (!md) return ''
    let html = escapeHtml(md)
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>')
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>')
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>')
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    html = html.replace(/(^|\n)- (.*?)(?=\n|$)/gim, '$1<li>$2</li>')
    html = html.replace(/(?:<li>.*?<\/li>\s*)+/gms, (m) => `<ul>${m}</ul>`)
    html = html.replace(/\n/g, '<br/>')
    return html
  }

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
                  <ul className="list-disc pl-5 space-y-2">
                    {result.findings.map((f, idx) => (
                      <li key={idx}><SidebarFindingItem article={f.article} issue={f.issue} /></li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500">No findings</div>
                )}
              </div>
            </div>

            <div className="mb-4"><h3 className="font-semibold">Total Saved Past Reports {userReportsCount !== null ? `(${userReportsCount} total)` : ''}</h3>
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
                <button className={`px-3 py-1 border text-sm flex items-center ${activeTab === 'full' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`} onClick={async () => { setActiveTab('full'); await loadDetailed() }}>
                  <FileCheck className="h-4 w-4 mr-2" /> Full
                </button>
                <button className={`px-3 py-1 border text-sm flex items-center ${activeTab === 'revised' ? 'bg-blue-600 text-white border-blue-600 rounded-r' : 'bg-white text-gray-700 border-gray-200 rounded-r'}`} onClick={async () => { setActiveTab('revised'); await loadDetailed() }}>
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
                  {loadingDetailed ? (
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
                  ) : detailedReport ? (
                    <div className="prose max-w-none text-sm">
                      <h1>{detailedReport.document_name ?? detailedReport.filename}</h1>
                      <div className="text-sm text-gray-600">Verdict: {detailedReport.verdict}</div>
                      <div className="text-sm text-gray-600">Score: {detailedReport.score ?? ''}%</div>
                      {detailedReport.content ? (
                        <div className="mt-4" dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(detailedReport.content) }} />
                      ) : (
                        <>
                          {detailedReport.findings && detailedReport.findings.length > 0 && (
                            <div className="mt-4">
                              <h3 className="font-medium">Findings</h3>
                              <div className="mt-2 space-y-2">
                                {detailedReport.findings.map((f: FindingLike, i: number) => (
                                  <FindingCard key={i} finding={f} />
                                ))}
                              </div>
                            </div>
                          )}
                          {detailedReport.recommendations && detailedReport.recommendations.length > 0 && (
                            <div className="mt-4">
                              <h3 className="font-medium">Recommendations</h3>
                              <ul className="list-disc pl-5 mt-2 text-sm text-gray-800">
                                {detailedReport.recommendations.map((r: RecommendationLike, i: number) => {
                                  const maybe = r as unknown as Record<string, unknown>
                                  const suggestion = typeof maybe.suggestion === 'string' ? maybe.suggestion : JSON.stringify(r)
                                  return (<li key={i}>{suggestion}</li>)
                                })}
                              </ul>
                            </div>
                          )}
                          {detailedReport.evidence && detailedReport.evidence.length > 0 && (
                            <div className="mt-4">
                              <h3 className="font-medium">Evidence</h3>
                              <div className="mt-2 space-y-2 text-sm text-gray-800">
                                {detailedReport.evidence.map((e: EvidenceLike, i: number) => (
                                  <div key={i} className="p-2 bg-white rounded shadow-sm">{e.policy_excerpt ?? JSON.stringify(e)}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ) : detailedContent ? (
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
