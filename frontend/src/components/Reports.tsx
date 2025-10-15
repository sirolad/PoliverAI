import { useState, useEffect } from 'react'
<<<<<<< HEAD
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
import ReportsToolbar from './reports-ui/ReportsToolbar'
import { classifyDeletedDetails } from '@/lib/reportHelpers'
import { filterReports } from './reports-ui/reportsHelpers'
import useReports from './reports-ui/useReports'
import useSelection from './reports-ui/useSelection'
import useResponsiveFilters from './reports-ui/useResponsiveFilters'
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
import Filters from './reports-ui/Filters'
import BulkActions from './reports-ui/BulkActions'
import Heading from './ui/Heading'
import { twFromTokens, colors, spacing, alignment } from '@/styles/styleTokens'

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
  <div className={twFromTokens('min-h-screen', spacing.pagePadding)}>
    <PaymentResultModal open={modalOpen} success={modalSuccess} title={modalTitle} message={modalMessage} onClose={() => setModalOpen(false)} />
    <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.justifyBetween, spacing.headingMargin)}>
      <Heading as="h1" className={twFromTokens(spacing.headingOffset)}>{t('reports.title')}</Heading>
      <div className={twFromTokens(alignment.flexRow, alignment.itemsCenter, alignment.gap3)}>
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
      className={twFromTokens('grid', spacing.gridGapLarge, alignment.itemsStart)}
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
  <main className={twFromTokens(colors.surface, spacing.card, 'rounded', 'shadow')}>
        {/* Loading state: show Analysis-style centered spinner when refreshing */}
        {isLoading ? (
          <div className={twFromTokens('h-[60vh]', alignment.center)}>
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

          <div className={twFromTokens('space-y-3', 'max-h-[70vh]', 'overflow-auto')}>
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
=======
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Download,
  ArrowLeft,
  Calendar,
  FileCheck,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import policyService from '../services/policyService'

interface ReportMetadata {
  filename: string
  title: string
  type: 'verification' | 'revision'
  created_at: string
  file_size: number
  document_name?: string
  analysis_mode?: string
}

export default function Reports() {
  const { isAuthenticated, isPro, loading } = useAuth()
  const navigate = useNavigate()

  const [reports, setReports] = useState<ReportMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isPro) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const userReports = await policyService.getUserReports()
      setReports(userReports)
    } catch (err) {
      console.error('Failed to fetch reports:', err)
      setError('Failed to load reports. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (filename: string) => {
    setDownloadingReport(filename)
    try {
      await policyService.downloadReport(filename)
    } catch (err) {
      console.error('Download failed:', err)
      setError('Failed to download report. Please try again.')
    } finally {
      setDownloadingReport(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
    return Math.round(bytes / (1024 * 1024)) + ' MB'
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'verification':
        return <FileCheck className="h-6 w-6 text-blue-600" />
      case 'revision':
        return <FileText className="h-6 w-6 text-green-600" />
      default:
        return <FileText className="h-6 w-6 text-gray-600" />
    }
  }

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'verification':
        return 'Compliance Report'
      case 'revision':
        return 'Policy Revision'
      default:
        return 'Report'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Your Reports
              </h1>
              <p className="text-gray-600">
                Access and download your generated compliance reports and policy revisions
              </p>
            </div>

            <Button
              onClick={fetchReports}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">Error</p>
              </div>
              <p className="text-red-700 mt-2">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Reports List */}
        {!isLoading && reports.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Reports Yet
              </h3>
              <p className="text-gray-600 mb-6">
                You haven't generated any reports yet. Start by analyzing a privacy policy.
              </p>
              <Button
                onClick={() => navigate('/analyze')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Analyze New Policy
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.filename} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getReportIcon(report.type)}
                      <div>
                        <CardTitle className="text-lg">
                          {getReportTypeLabel(report.type)}
                        </CardTitle>
                        <CardDescription>
                          {report.document_name && `Document: ${report.document_name}`}
                          {report.analysis_mode && ` • Mode: ${report.analysis_mode}`}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="text-right">
                      <Button
                        onClick={() => handleDownload(report.filename)}
                        disabled={downloadingReport === report.filename}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloadingReport === report.filename ? 'Downloading...' : 'Download'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(report.created_at)}
                      </span>
                      <span>{formatFileSize(report.file_size)}</span>
                    </div>
                    <span className="font-mono text-xs text-gray-500">
                      {report.filename}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About Your Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <FileCheck className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <strong>Compliance Reports:</strong> Comprehensive GDPR analysis results with detailed findings, recommendations, and evidence from your policy analyses.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <strong>Policy Revisions:</strong> AI-generated revised policy documents that address identified compliance issues.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
>>>>>>> main
      </div>
    </div>
  )
}
