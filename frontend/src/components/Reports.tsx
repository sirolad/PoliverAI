import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '@/contexts/useAuth'
import policyService from '@/services/policyService'
import { getApiBaseOrigin } from '@/lib/paymentsHelpers'
import ReportViewerModal from './ui/ReportViewerModal'
import PaymentResultModal from './ui/PaymentResultModal'
import ConfirmBulkDeleteModal from './ui/ConfirmBulkDeleteModal'
import type { ReportMetadata } from '@/types/api'
import { ChevronLeft, ChevronRight, Filter, Trash2, Eye } from 'lucide-react'
import { classifyDeletedDetails } from '@/lib/reportHelpers'
import ReportCard from '@/components/ui/ReportCard'
import { Button } from '@/components/ui/Button'
import ErrorText from '@/components/ui/ErrorText'
import { safeDispatch, safeDispatchMultiple } from '@/lib/eventHelpers'
// local small responsive overrides
import '@/styles/responsive.css'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { pushEvent, addToLegacy } from '@/store/deletedReportsSlice'
import Filters from './reports/Filters'
import BulkActions from './reports/BulkActions'

export default function Reports() {
  const { isAuthenticated, isPro, loading, user } = useAuth()
  const dispatch = useAppDispatch()
  // showFilters: controls whether the filter sidebar is visible.
  // Default: visible when viewport > 700px, hidden when <= 700px. If the user
  // manually toggles, their preference persists across resizes.
  const [showFilters, setShowFilters] = useState<boolean>(true)
  // When true the filters are rendered above the reports list (stacked)
  // instead of in a left sidebar. This kicks in for widths <= 1276px.
  const [isMobile1276, setIsMobile1276] = useState<boolean>(() => (typeof window !== 'undefined' ? window.innerWidth <= 1276 : false))
  const [reports, setReports] = useState<ReportMetadata[]>([])
  const [page, setPage] = useState<number>(1)
  const [limit, setLimit] = useState<number>(10)
  const [total, setTotal] = useState<number | null>(null)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>({})
  // progress was part of the old in-file filters UI and has been removed.
  // progress indicator removed; filters component handles its own loading UI.
  const selectedFromStore = useAppSelector((s) => s.ui.selectedReport)
  const [selected, setSelected] = useState<string | null>(() => selectedFromStore || null)

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

  // initialize showFilters based on viewport and respond to resizes
  useEffect(() => {
    const onResize = () => {
      const isMobile = window.innerWidth <= 700
    setShowFilters(!isMobile)
      // when the viewport is 1276px or less, stack filters on top of the list
      setIsMobile1276(window.innerWidth <= 1276)
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
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
  // Loading progress indicator was moved out with Filters; no local animation needed here.
  }, [isLoading])

  // selection is handled by checkboxes; persisted "selected" (single) remains for modal/view

  const onOpen = async (report: ReportMetadata) => {
    try {
      // Instead of opening a new tab, show modal viewer for a smoother UX
      const apiBase = getApiBaseOrigin() ?? 'http://localhost:8000'
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

  // Don't block the whole page while auth/loading — show progress inside filters
  if (!isAuthenticated && loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
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

  return (
    <div className="min-h-screen p-8">
      <PaymentResultModal open={modalOpen} success={modalSuccess} title={modalTitle} message={modalMessage} onClose={() => setModalOpen(false)} />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Your Reports</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFilters((s) => !s)}
            aria-pressed={showFilters}
            icon={<Filter className="h-4 w-4" />}
            collapseToIcon
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <BulkActions deleting={deleting} onRefresh={fetchReports} onDeleteOpen={() => setBulkDeleteOpen(true)} />
          <ConfirmBulkDeleteModal
            open={bulkDeleteOpen}
            filenames={Object.keys(selectedFiles).filter((k) => selectedFiles[k])}
            onClose={() => setBulkDeleteOpen(false)}
            icon={<Trash2 className="h-5 w-5 text-gray-700" />}
            onConfirm={async () => {
              setBulkDeleteOpen(false)
              setDeleting(true)
              // original bulk-delete logic (unchanged)
              const fns = Object.keys(selectedFiles).filter((k) => selectedFiles[k])
              try {
                // start of bulk-delete
                const resp = await policyService.bulkDeleteReports(fns)

                type BulkRes = { filename: string; deleted: boolean; error?: string }
                const results = resp.results as BulkRes[]
                const deleted = results.filter((r) => r.deleted).map((r) => r.filename)
                const failed = results.filter((r) => !r.deleted)

                setReports((prev) => prev.filter(r => !deleted.includes(r.filename)))
                const newSel = { ...selectedFiles }
                deleted.forEach((d) => { delete newSel[d] })
                setSelectedFiles(newSel)

                // Classify deleted files by type using the reports array we just updated
                try {
                  const deletedMeta = results.filter((r) => r.deleted).map((r) => r.filename)
                  const deletedDetails = classifyDeletedDetails(reports, deletedMeta)

                  // Use Redux slice to persist deletion events and update legacy totals
                  try {
                    let full = 0, revision = 0, free = 0
                    deletedDetails.forEach((d) => {
                      if (d.is_full_report) full += 1
                      if (d.is_revision) revision += 1
                      if (d.is_free) free += 1
                    })
                    const counts = { full, revision, free }
                    const ev = { ts: Date.now(), counts, filenames: deletedMeta }
                    dispatch(pushEvent(ev))
                    dispatch(addToLegacy(counts))
                    // Keep compatibility: emit the same global event so other listeners still work
                    try {
                      safeDispatch('reports:deleted', { counts, filenames: deletedMeta })
                    } catch (e) {
                      console.warn('Failed to dispatch reports:deleted', e)
                    }
                  } catch (e) {
                    console.warn('Failed to dispatch deleted report counts to store', e)
                  }
                } catch (e) {
                  console.warn('Failed to classify deleted reports', e)
                }

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
                // finished bulk-delete
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
  <ErrorText error={error} />

    <div
      className="grid gap-6 items-start"
      style={{ gridTemplateColumns: isMobile1276 ? '1fr' : (showFilters ? '320px 1fr' : '1fr') }}
    >
    {/* When stacking is enabled we render the filters first so they appear on top */}
      {isMobile1276 ? (
      <div className={`${showFilters ? '' : 'hidden'} self-start`}>
        <Filters
          query={query}
          setQuery={setQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          verdictOptions={verdictOptions}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          isLoading={isLoading}
          clearAll={() => { setQuery(''); setStatusFilter('all'); setStartDate(''); setEndDate(''); setSelectedFiles({}) }}
        />
      </div>
    ) : (
      <div className={`${showFilters ? '' : 'hidden'} self-start`}>
        <Filters
          query={query}
          setQuery={setQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          verdictOptions={verdictOptions}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          isLoading={isLoading}
          clearAll={() => { setQuery(''); setStatusFilter('all'); setStartDate(''); setEndDate(''); setSelectedFiles({}) }}
        />
      </div>
    )}

  {/* Right: reports list */}
  <main className={'bg-white p-4 rounded shadow'}>
        {/* Loading state: show Analysis-style centered spinner when refreshing */}
        {isLoading ? (
          <div className="h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-white shadow">
                <svg className="animate-spin h-12 w-12 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              </div>
              <div className="mt-4 text-lg font-semibold">Loading reports…</div>
              <div className="mt-2 text-sm text-gray-500">Refreshing the reports list — this may take a moment.</div>
            </div>
          </div>
        ) : null}
        {/* Empty state: no reports */}
        {!isLoading && (!reports || reports.length === 0) ? (
          <div className="h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto w-32 h-32 flex items-center justify-center rounded-full bg-gray-100">
                <svg className="h-12 w-12 text-gray-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 13l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="mt-4 text-lg font-semibold">No reports yet 🙂</div>
              <div className="mt-2 text-sm text-gray-500">Run an analysis to create your first report.</div>
            </div>
          </div>
        ) : null}
          {!isLoading && (
          <>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 ml-4">
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
                <span className="text-sm hide-below-700">Select all</span>

                <div className="text-sm text-gray-600">{isLoading ? 'Loading...' : (total != null ? `${filtered.length} / ${total} results` : `${filtered.length} results`)}</div>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 ml-4">
                <label className="text-sm text-gray-600 hide-below-700">Per page</label>
                <select value={limit} onChange={(e) => { setPage(1); setLimit(Number(e.target.value)) }} className="border rounded px-2 py-1 hide-below-700">
                  {[10,20,30,40,50].map((n) => (<option key={n} value={n}>{n}</option>))}
                </select>
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p-1))} className="flex items-center" icon={<ChevronLeft className="h-4 w-4"/>}><span className="hide-below-700">Prev</span></Button>
                <div className="px-2 py-1 text-sm">{page} / {totalPages}</div>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p+1))} className="flex items-center" icon={<ChevronRight className="h-4 w-4"/>}><span className="hide-below-700">Next</span></Button>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-auto">
            {filtered.map((r) => (
              <ReportCard
                key={r.filename}
                report={r}
                selected={!!selectedFiles[r.filename]}
                onToggleSelect={(fn: string) => setSelectedFiles((prev) => ({ ...prev, [fn]: !prev[fn] }))}
                onOpen={onOpen}
                onDownload={onDownload}
              />
            ))}
          </div>
            {modalUrl ? (
              <ReportViewerModal
                reportUrl={modalUrl}
                filename={selected}
                title={selected || 'Report'}
                icon={<Eye className="h-5 w-5 text-gray-700" />}
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
                    safeDispatchMultiple([
                      { name: 'payment:refresh-user' },
                      { name: 'transactions:refresh' },
                      { name: 'reports:refresh' },
                    ])
                  } catch (e) {
                    console.warn('dispatch refresh events failed', e)
                  }
                }}
              />
            ) : null}
          </>
          )}
        </main>
      </div>
    </div>
  )
}
