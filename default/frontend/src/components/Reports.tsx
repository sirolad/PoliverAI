import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '@/contexts/useAuth'
import policyService from '@/services/policyService'
import type { ReportMetadata } from '@/types/api'

export default function Reports() {
  const { isAuthenticated, isPro, loading, user } = useAuth()
  const [reports, setReports] = useState<ReportMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [showBar, setShowBar] = useState<boolean>(false)
  const [selected, setSelected] = useState<string | null>(() => {
    try {
      return localStorage.getItem('selected_report')
    } catch {
      return null
    }
  })
  const [query, setQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const r = await policyService.getUserReports()
      setReports(r)
      if (!r || r.length === 0) {
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
  }

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

  const onSelect = (report: ReportMetadata) => {
    setSelected(report.filename)
    try {
      localStorage.setItem('selected_report', report.filename)
    } catch (err) {
      console.warn('Could not persist selected report', err)
    }
  }

  const onOpen = async (report: ReportMetadata) => {
    try {
      await policyService.openReport(report)
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
      // reports may carry a 'verdict' or 'status' field in metadata
      const s = (r.verdict || r.status || '').toLowerCase()
      if (!s.includes(statusFilter)) return false
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

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Your Reports</h1>
      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: filters / controls */}
        <aside className="md:col-span-1 bg-white p-4 rounded shadow">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">Filters</div>
              <button onClick={fetchReports} className="text-sm text-blue-600">Refresh</button>
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
              <option value="compliant">Compliant</option>
              <option value="partially_compliant">Partially compliant</option>
              <option value="non_compliant">Non-compliant</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Date range</label>
            <div className="flex gap-2">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-1/2 border rounded px-2 py-1" />
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-1/2 border rounded px-2 py-1" />
            </div>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            Showing <span className="font-semibold">{filtered.length}</span> of <span className="font-semibold">{reports.length}</span> reports
          </div>

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
            <div className="text-lg font-medium">Reports</div>
            <div className="text-sm text-gray-600">{isLoading ? 'Loading...' : `${filtered.length} results`}</div>
          </div>

          <div className="space-y-3 max-h-[70vh] overflow-auto">
            {filtered.map((r) => (
              <div key={r.filename} className={`p-4 border rounded ${selected === r.filename ? 'border-blue-600 bg-blue-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">{r.title || r.document_name}</div>
                    <div className="text-sm text-gray-600">{r.document_name}</div>
                    <div className="text-sm text-gray-500 mt-1">{new Date(r.created_at).toLocaleString()}</div>
                    {r.file_size ? (
                      <div className="text-sm text-gray-500">Size: {(r.file_size / 1024).toFixed(1)} KB</div>
                    ) : null}
                    {/* Verdict badge */}
                    {r.verdict ? (
                      <div className="inline-flex items-center mt-2 px-2 py-1 rounded text-xs font-medium bg-gray-100">
                        <span className="mr-2 text-gray-700">Verdict:</span>
                        <span className={`px-2 py-0.5 rounded ${r.verdict === 'compliant' ? 'bg-green-100 text-green-700' : r.verdict === 'partially_compliant' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{r.verdict}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex-shrink-0 ml-4 flex items-center space-x-2">
                    {r.gcs_url ? (
                      <a href={r.gcs_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600">Open</a>
                    ) : null}
                    <button onClick={() => onOpen(r)} className="bg-transparent text-blue-600 px-3 py-1 rounded border border-blue-200">View</button>
                    <button onClick={() => onDownload(r)} className="bg-blue-600 text-white px-3 py-1 rounded">Download</button>
                    <button onClick={() => onSelect(r)} className={`px-3 py-1 rounded ${selected === r.filename ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>
                      {selected === r.filename ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
