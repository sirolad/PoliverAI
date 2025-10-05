import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '@/contexts/useAuth'
import policyService from '@/services/policyService'
import ReportViewerModal from './ui/ReportViewerModal'
import PaymentResultModal from './ui/PaymentResultModal'
import ConfirmBulkDeleteModal from './ui/ConfirmBulkDeleteModal'
import type { ReportMetadata } from '@/types/api'
import { Star, StarHalf, Star as StarEmpty } from 'phosphor-react'
import { RefreshCcw, Trash2, DownloadCloud, ExternalLink, ChevronLeft, ChevronRight, X } from 'lucide-react'

export default function Reports() {
  const { isAuthenticated, isPro, loading, user } = useAuth()
  const [reports, setReports] = useState<ReportMetadata[]>([])
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [total, setTotal] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>({})
  const [progress, setProgress] = useState<number>(0)
  const [showBar, setShowBar] = useState<boolean>(false)
  const [selected, setSelected] = useState<string | null>(() => {
    try {
      return localStorage.getItem('selected_report')
    } catch {
      return null
    }
  })

  const fetchReports = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const resp = await policyService.getUserReports({ page, limit })
      // Handle both legacy array response and new paged response
      let arr: ReportMetadata[] = []
      if (Array.isArray(resp)) {
        arr = resp as ReportMetadata[]
        setReports(arr)
        setTotal(arr.length)
        setTotalPages(1)
      } else {
        arr = resp.reports || []
        setReports(arr)
        setTotal(resp.total ?? arr.length)
        setTotalPages(resp.total_pages ?? 1)
      }
      // Use the freshly-loaded array to determine empty-state
      if (!arr || arr.length === 0) {
        setError('You have no reports on file with us yet 🙂')
      } else {
        setError(null)
      }
    } catch (e) {
      console.error('Failed to fetch reports', e)
      setError('Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }, [page, limit])
  const [query, setQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [verdictOptions, setVerdictOptions] = useState<string[]>([])
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [modalUrl, setModalUrl] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSuccess, setModalSuccess] = useState(true)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMessage, setModalMessage] = useState<string | undefined>()
  const [deleting, setDeleting] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  useEffect(() => {
    const h = () => { fetchReports().catch((e) => console.warn('reports refresh failed', e)) }
    window.addEventListener('reports:refresh', h)
    return () => window.removeEventListener('reports:refresh', h)
  }, [fetchReports])

  // fetch verdict options once on mount
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const vresp = await policyService.getReportVerdicts()
        if (mounted) setVerdictOptions(vresp.verdicts || [])
      } catch (e) {
        console.warn('Failed to load verdict options', e)
      }
    })()
    return () => { mounted = false }
  }, [])

  // keep selectedFiles in sync when reports list changes
  // Only run when the reports array changes (don't include selectedFiles so we don't
  // overwrite user toggles). This preserves selection for filenames that still exist
  // and drops selections for removed items.
  useEffect(() => {
    setSelectedFiles((prev) => {
      const next: Record<string, boolean> = {}
      reports.forEach((r) => {
        if (prev[r.filename]) next[r.filename] = true
      })
      return next
    })
  }, [reports])

  // fetchReports is defined above as a useCallback

  // Animate small progress while loading reports
  useEffect(() => {
    let interval: number | undefined
    let timeout: number | undefined
    if (isLoading) {
      setShowBar(true)
      setProgress(12)
      interval = window.setInterval(() => {
        setProgress((p) => Math.min(90, Math.round(p + Math.random() * 10)))
      }, 400) as unknown as number
    } else {
      setProgress(100)
      timeout = window.setTimeout(() => setShowBar(false), 700) as unknown as number
    }
    return () => {
      if (interval) clearInterval(interval)
      if (timeout) clearTimeout(timeout)
    }
  }, [isLoading])

  // selection is handled by checkboxes; persisted "selected" (single) remains for modal/view

  const onOpen = async (report: ReportMetadata) => {
    try {
      // Instead of opening a new tab, show modal viewer for a smoother UX
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      // Always use our download endpoint inside the modal iframe so external gs:// or signed URLs
      // don't break iframe rendering. Use a separate Open action to open the best URL in a new tab.
      const url = `${apiBase}/api/v1/reports/download/${encodeURIComponent(report.filename)}`
      setSelected(report.filename)
      setModalUrl(url)
    } catch (err) {
      console.error('Failed to open report', err)
      setError('Failed to open report')
    }
  }

  const onDownload = async (report: ReportMetadata) => {
    try {
      await policyService.downloadReport(report.filename)
    } catch (err) {
      console.error('Failed to download report', err)
      setError('Failed to download report')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Allow access to Reports if user is PRO or has credits available
  const hasCredits = (user?.credits ?? 0) > 0
  if (!isPro && !hasCredits) return <Navigate to="/dashboard" replace />

  const filtered = reports.filter((r) => {
    if (query) {
      const q = query.toLowerCase()
      if (!((r.title || r.document_name || '').toLowerCase().includes(q) || r.filename.toLowerCase().includes(q))) return false
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'full') {
        // treat as full if explicitly flagged, or if type indicates a generated verification report
        if (!(r.is_full_report || (r.type && String(r.type).toLowerCase() === 'verification'))) return false
      } else {
        // normalize verdict/status for robust matching (handles 'Compliant', 'partially compliant', etc.)
        const normalize = (s?: string) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
        const v = normalize((r.verdict || r.status) as string)
        if (!v || v !== statusFilter) return false
      }
    }
    if (startDate) {
      const d = new Date(r.created_at)
      if (d < new Date(startDate)) return false
    }
    if (endDate) {
      const d = new Date(r.created_at)
      // include whole day
      const ed = new Date(endDate)
      ed.setHours(23, 59, 59, 999)
      if (d > ed) return false
    }
    return true
  })

  // selection summary for UI labels
  const allOnPageSelected = filtered.length > 0 && filtered.every((f) => !!selectedFiles[f.filename])

  return (
    <div className="min-h-screen p-8">
      <PaymentResultModal open={modalOpen} success={modalSuccess} title={modalTitle} message={modalMessage} onClose={() => setModalOpen(false)} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Your Reports</h1>
        <div className="flex items-center gap-2">
          <button onClick={fetchReports} className="px-3 py-1 bg-white border rounded flex items-center"><RefreshCcw className="h-4 w-4 mr-2"/>Refresh</button>
          <button
            disabled={deleting}
            onClick={async () => {
              const fns = Object.keys(selectedFiles).filter((k) => selectedFiles[k])
              if (fns.length === 0) return
              // open confirmation modal and perform delete on confirm
              setBulkDeleteOpen(true)
            }}
            className="px-3 py-1 bg-red-600 text-white rounded flex items-center"
          >
            <><Trash2 className="h-4 w-4 mr-2"/>{allOnPageSelected ? 'Delete All' : 'Delete Selected'}</>
          </button>
          <ConfirmBulkDeleteModal
            open={bulkDeleteOpen}
            filenames={Object.keys(selectedFiles).filter((k) => selectedFiles[k])}
            onClose={() => setBulkDeleteOpen(false)}
            onConfirm={async () => {
              setBulkDeleteOpen(false)
              setDeleting(true)
              // run the original bulk-delete logic
              const fns = Object.keys(selectedFiles).filter((k) => selectedFiles[k])
              let interval: number | undefined
              try {
                setShowBar(true)
                setProgress(10)
                interval = window.setInterval(() => {
                  setProgress((p) => Math.min(90, Math.round(p + Math.random() * 10)))
                }, 300) as unknown as number

                const resp = await policyService.bulkDeleteReports(fns)
                if (interval) { clearInterval(interval); interval = undefined }
                setProgress(100)
                window.setTimeout(() => setShowBar(false), 600)

                type BulkRes = { filename: string; deleted: boolean; error?: string }
                const results = resp.results as BulkRes[]
                const deleted = results.filter((r) => r.deleted).map((r) => r.filename)
                const failed = results.filter((r) => !r.deleted)

                setReports((prev) => prev.filter(r => !deleted.includes(r.filename)))
                const newSel = { ...selectedFiles }
                deleted.forEach((d) => { delete newSel[d] })
                setSelectedFiles(newSel)

                if (failed.length === 0) {
                  setModalSuccess(true)
                  setModalTitle(`Deleted ${deleted.length} report${deleted.length !== 1 ? 's' : ''}`)
                  setModalMessage(deleted.slice(0, 6).join(', '))
                } else if (deleted.length === 0) {
                  setModalSuccess(false)
                  setModalTitle('Failed to delete reports')
                  setModalMessage(failed.map(f => `${f.filename}: ${f.error || 'unknown error'}`).join('\n'))
                } else {
                  setModalSuccess(false)
                  setModalTitle('Partial delete')
                  setModalMessage(`Deleted: ${deleted.join(', ')}\nFailed: ${failed.map(f => f.filename).join(', ')}`)
                }
                setModalOpen(true)
              } catch (err) {
                const e = err as unknown
                if (interval) clearInterval(interval)
                setProgress(100)
                window.setTimeout(() => setShowBar(false), 600)
                console.error('Bulk delete failed', e)
                setModalSuccess(false)
                setModalTitle('Bulk delete failed')
                const extractMessage = (x: unknown): string => {
                  if (!x) return String(x)
                  if (typeof x === 'string') return x
                  if (typeof x === 'object' && 'message' in (x as Record<string, unknown>)) return String((x as Record<string, unknown>)['message'])
                  return String(x)
                }
                setModalMessage(extractMessage(e))
                setModalOpen(true)
              } finally {
                setDeleting(false)
              }
            }}
          />
        </div>
      </div>
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: filters / controls */}
        <aside className="md:col-span-1 bg-white p-4 rounded shadow">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">Filters</div>
              <button
                onClick={() => {
                  setQuery('')
                  setStatusFilter('all')
                  setStartDate('')
                  setEndDate('')
                  setSelectedFiles({})
                }}
                className="text-sm text-blue-600 flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear filters
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Search</label>
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="file name or title" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Verdict / Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="all">All</option>
              <option value="compliant">Compliance Reports</option>
              {verdictOptions.filter(v => v !== 'compliant').map((v) => (
                <option key={v} value={v}>{v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
              <option value="full">Full Reports</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Date range</label>
            <div className="flex gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-1/2 border rounded px-2 py-1" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-1/2 border rounded px-2 py-1" />
            </div>
          </div>

          {/* count is shown in the header next to the select-all control */}

          {/* Loading progress bar */}
          <div className="mt-4">
            {showBar && (
              <div className="w-full">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-300 ease-out ${progress < 5 ? 'opacity-90 animate-pulse' : ''}`}
                    style={{ width: progress < 5 ? '25%' : `${Math.min(100, Math.max(2, progress))}%` }}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(100, Math.max(0, progress))}
                  />
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right: reports list */}
        <main className="md:col-span-2 bg-white p-4 rounded shadow">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every((f) => !!selectedFiles[f.filename])}
                  onChange={() => {
                    const allSelected = filtered.length > 0 && filtered.every((f) => !!selectedFiles[f.filename])
                    // toggle all visible
                    setSelectedFiles((prev) => {
                      const next = { ...prev }
                      filtered.forEach((f) => {
                        next[f.filename] = !allSelected
                      })
                      return next
                    })
                  }}
                  aria-label={filtered.length > 0 ? `Select all ${filtered.length} reports` : 'Select all reports'}
                />
                <span className="text-sm">Select all</span>

                <div className="text-sm text-gray-600">{isLoading ? 'Loading...' : `${filtered.length} results`}</div>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 ml-4">
                <label className="text-sm text-gray-600">Per page</label>
                <select value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)) }} className="border rounded px-2 py-1">
                  {[10,20,30,40,50].map((n) => (<option key={n} value={n}>{n}</option>))}
                </select>
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p-1))} className="px-2 py-1 border rounded flex items-center"><ChevronLeft className="h-4 w-4 mr-1"/>Prev</button>
                <div className="px-2 py-1 text-sm">{page} / {totalPages}</div>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p+1))} className="px-2 py-1 border rounded flex items-center">Next<ChevronRight className="h-4 w-4 ml-1"/></button>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-auto">
            {filtered.map((r) => (
              <div key={r.filename} className={`p-4 border rounded flex items-center ${selectedFiles[r.filename] ? 'border-blue-600 bg-blue-50' : ''}`}>
                <div className="mr-4 flex items-center h-full">
                  <input
                    type="checkbox"
                    checked={!!selectedFiles[r.filename]}
                    onChange={() => setSelectedFiles((prev) => ({ ...prev, [r.filename]: !prev[r.filename] }))}
                    className="w-4 h-4"
                    aria-label={`Select report ${r.filename}`}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{r.title || r.document_name}</div>
                  <div className="text-sm text-gray-600">{r.document_name}</div>
                  <div className="text-sm text-gray-500 mt-1">{new Date(r.created_at).toLocaleString()}</div>
                  {/* Filename line: shown above the size, styled like the size text */}
                  <div className="text-sm text-gray-500 truncate">filename: <span className="font-mono">{r.filename}</span></div>
                  {r.file_size ? (
                    <div className="text-sm text-gray-500">Size: {(r.file_size / 1024).toFixed(1)} KB</div>
                  ) : null}
                  {/* Rating: map score (0-100) to 0-5 stars and display percent beside verdict badges */}
                  <div className="mt-2 ml-2 mr-2 flex items-center gap-2">
                    {(() => {
                      const score = typeof r.score === 'number' ? Math.max(0, Math.min(100, r.score)) : undefined
                      if (score == null) return null
                      const stars = (score / 100) * 5
                      const full = Math.floor(stars)
                      const half = stars - full >= 0.5 ? 1 : 0
                      const empty = 5 - full - half
                      const icons: JSX.Element[] = []
                      for (let i = 0; i < full; i++) icons.push(<Star key={`f-${i}`} size={16} weight="fill" className="text-yellow-500" />)
                      if (half) icons.push(<StarHalf key={`h`} size={16} weight="fill" className="text-yellow-500" />)
                      for (let i = 0; i < empty; i++) icons.push(<StarEmpty key={`e-${i}`} size={16} weight="duotone" className="text-gray-300" />)
                      return (
                        <div className="flex items-center text-sm text-gray-700">
                          <div className="flex items-center gap-0.5">{icons}</div>
                          <div className="ml-2 text-xs text-gray-500">{score}%</div>
                        </div>
                      )
                    })()}
                  </div>
                  {/* Badge group: Full/Compliance label and verdict badge share height and touch borders */}
                  {(() => {
                    const normalize = (s?: string) => (s || '').toString().trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
                    const isFull = Boolean(r.is_full_report || (r.type && String(r.type).toLowerCase() === 'verification'))
                    const vnorm = normalize(r.verdict)
                    const hasVerdict = Boolean(r.verdict)
                    if (!isFull && !hasVerdict) return null
                    return (
                      <div className="inline-flex items-center mt-2 text-xs font-medium rounded overflow-hidden">
                        {isFull ? (
                          <div className="px-2 py-1 bg-green-100 text-green-700 border border-r-0 border-green-200">Full</div>
                        ) : null}
                        {hasVerdict ? (
                          <div className={`px-2 py-1 border ${vnorm === 'compliant' ? 'bg-green-100 text-green-700 border-green-200' : vnorm === 'partially_compliant' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                            {String(r.verdict).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </div>
                        ) : null}
                      </div>
                    )
                  })()}
                </div>
                <div className="flex-shrink-0 ml-4 flex items-center space-x-2">
                  {r.gcs_url ? (
                    <button onClick={() => policyService.openReport(r)} className="text-sm text-blue-600 flex items-center"><ExternalLink className="h-4 w-4 mr-2"/>Open</button>
                  ) : null}
                  <button onClick={() => onOpen(r)} className="bg-transparent text-blue-600 px-3 py-1 rounded border border-blue-200 flex items-center"><ExternalLink className="h-4 w-4 mr-2"/>View</button>
                  <button onClick={() => onDownload(r)} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center"><DownloadCloud className="h-4 w-4 mr-2"/>Download</button>
                </div>
              </div>
            ))}
          </div>
          {modalUrl ? (
            <ReportViewerModal
              reportUrl={modalUrl}
              filename={selected}
              title={selected || 'Report'}
              isQuick={false}
              onClose={() => setModalUrl('')}
              onDeleted={(fn) => {
                setModalUrl('')
                // remove deleted from list
                setReports((prev) => prev.filter((p) => p.filename !== fn))
                setSelected((cur) => (cur === fn ? null : cur))
              }}
              onSaved={async () => {
                setModalUrl('')
                try {
                  // re-fetch the current page of reports so pagination and counts stay accurate
                  await fetchReports()
                } catch (e) {
                  console.warn('refresh reports after save failed', e)
                }
                try {
                  // refresh user and transactions so credits and tx list update
                  window.dispatchEvent(new CustomEvent('payment:refresh-user'))
                  window.dispatchEvent(new CustomEvent('transactions:refresh'))
                  window.dispatchEvent(new CustomEvent('reports:refresh'))
                } catch (e) {
                  console.warn('dispatch refresh events failed', e)
                }
              }}
            />
          ) : null}
        </main>
      </div>
    </div>
  )
}
