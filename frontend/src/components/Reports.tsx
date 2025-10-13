import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '@/contexts/useAuth'
import policyService from '@/services/policyService'
import { getApiBaseOrigin } from '@/lib/paymentsHelpers'
import ReportViewerModal from './ui/ReportViewerModal'
import PaymentResultModal from './ui/PaymentResultModal'
import ConfirmBulkDeleteModal from './ui/ConfirmBulkDeleteModal'
import type { ReportMetadata } from '@/types/api'
import { Filter, Trash2, Eye } from 'lucide-react'
import { t } from '@/i18n'
import ReportsToolbar from './reports/ReportsToolbar'
import { classifyDeletedDetails } from '@/lib/reportHelpers'
import { filterReports } from './reports/reportsHelpers'
import useReports from './reports/useReports'
import useSelection from './reports/useSelection'
import useResponsiveFilters from './reports/useResponsiveFilters'
import ReportCard from '@/components/ui/ReportCard'
import { Button } from '@/components/ui/Button'
import ErrorText from '@/components/ui/ErrorText'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import NoDataView from '@/components/ui/NoDataView'
import { safeDispatch, safeDispatchMultiple } from '@/lib/eventHelpers'
// local small responsive overrides
import '@/styles/responsive.css'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { pushEvent, addToLegacy } from '@/store/deletedReportsSlice'
import Filters from './reports/Filters'
import BulkActions from './reports/BulkActions'
import Heading from './ui/Heading'
import { twFromTokens, colors } from '@/styles/styleTokens'

export default function Reports() {
  const { isAuthenticated, isPro, loading, user } = useAuth()
  const dispatch = useAppDispatch()
  const { showFilters, setShowFilters, isMobile1276 } = useResponsiveFilters()
  const { reports, setReports, page, setPage, limit, setLimit, total, totalPages, isLoading, error, fetchReports } = useReports()
  const { selectedFiles, setSelectedFiles, syncWithReports } = useSelection({})
  // progress was part of the old in-file filters UI and has been removed.
  // progress indicator removed; filters component handles its own loading UI.
  const selectedFromStore = useAppSelector((s) => s.ui.selectedReport)
  const [selected, setSelected] = useState<string | null>(() => selectedFromStore || null)

  // sync selection when reports change
  useEffect(() => { syncWithReports(reports) }, [reports, syncWithReports])
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
  // (selection sync moved to useSelection hook via syncWithReports)

  // fetchReports is defined above as a useCallback

  // Animate small progress while loading reports
  useEffect(() => {
  // Loading progress indicator was moved out with Filters; no local animation needed here.
  }, [isLoading])

  // selection is handled by checkboxes; persisted "selected" (single) remains for modal/view

  const onOpen = async (report: ReportMetadata) => {
    try {
      const apiBase = getApiBaseOrigin() ?? 'http://localhost:8000'
      const url = `${apiBase}/api/v1/reports/download/${encodeURIComponent(report.filename)}`
      setSelected(report.filename)
      setModalUrl(url)
    } catch (err) {
      console.error('Failed to open report', err)
      setModalSuccess(false)
      setModalTitle(t('reports.failed_open_report'))
      setModalMessage(String(err))
      setModalOpen(true)
    }
  }

  const onDownload = async (report: ReportMetadata) => {
    try {
      await policyService.downloadReport(report.filename)
    } catch (err) {
      console.error('Failed to download report', err)
      setModalSuccess(false)
      setModalTitle(t('reports.failed_download_report'))
      setModalMessage(String(err))
      setModalOpen(true)
    }
  }

  // Don't block the whole page while auth/loading — show progress inside filters
  if (!isAuthenticated && loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner message={t('loading.short')} size="lg" />
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  // Allow access to Reports if user is PRO, has credits available, or
  // already has at least one saved report. We only redirect when the
  // reports list has finished loading and the user truly has no files.
  const hasCredits = (user?.credits ?? 0) > 0
  const hasSavedReports = (reports && reports.length > 0)
  if (!isPro && !hasCredits && !isLoading && !hasSavedReports) return <Navigate to="/dashboard" replace />

  const filtered: ReportMetadata[] = filterReports(reports, { query, statusFilter, startDate, endDate })

  // selection summary for UI labels

  return (
    <div className="min-h-screen p-8">
      <PaymentResultModal open={modalOpen} success={modalSuccess} title={modalTitle} message={modalMessage} onClose={() => setModalOpen(false)} />
    <div className="flex items-center justify-between mb-4">
  <Heading as="h1" className="mr-4">{t('reports.title')}</Heading>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFilters((s) => !s)}
            aria-pressed={showFilters}
            icon={<Filter className="h-4 w-4" />}
            collapseToIcon
          >
            {showFilters ? t('filters.hide') : t('filters.show')}
          </Button>
          <BulkActions deleting={deleting} onRefresh={fetchReports} onDeleteOpen={() => setBulkDeleteOpen(true)} />
          <ConfirmBulkDeleteModal
            open={bulkDeleteOpen}
            filenames={Object.keys(selectedFiles).filter((k) => selectedFiles[k])}
            onClose={() => setBulkDeleteOpen(false)}
            icon={<Trash2 className={twFromTokens(colors.textMuted, 'h-5', 'w-5')} />}
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
                  setModalTitle(t('bulk_delete.deleted_title', { count: String(deleted.length) }))
                  setModalMessage(deleted.slice(0, 6).join(', '))
                } else if (deleted.length === 0) {
                  setModalSuccess(false)
                  setModalTitle(t('bulk_delete.failed'))
                  setModalMessage(failed.map(f => `${f.filename}: ${f.error || 'unknown error'}`).join('\n'))
                } else {
                  setModalSuccess(false)
                  setModalTitle(t('bulk_delete.partial'))
                  setModalMessage(`Deleted: ${deleted.join(', ')}\nFailed: ${failed.map(f => f.filename).join(', ')}`)
                }
                setModalOpen(true)
              } catch (err) {
                const e = err as unknown
                // finished bulk-delete
                console.error('Bulk delete failed', e)
                setModalSuccess(false)
                setModalTitle(t('errors.bulk_delete_failed'))
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
            <LoadingSpinner message={t('loading.reports')} subtext={t('loading.reports_subtext')} size="lg" />
          </div>
        ) : null}
        {/* Empty state: no reports */}
        {!isLoading && (!reports || reports.length === 0) ? (
          <div className="h-[60vh]">
            <NoDataView title={t('reports.no_reports_title')} message={t('reports.no_reports_message')} iconType="report" />
          </div>
        ) : null}
          {!isLoading && (
          <>
          <ReportsToolbar
            filtered={filtered}
            selectedFiles={selectedFiles}
            setSelectedFiles={setSelectedFiles}
            isLoading={isLoading}
            total={total}
            limit={limit}
            setLimit={setLimit}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
          />

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
                title={selected || t('reports.report')}
                icon={<Eye className={twFromTokens(colors.textMuted, 'h-5', 'w-5')} />}
                showSave={false}
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
